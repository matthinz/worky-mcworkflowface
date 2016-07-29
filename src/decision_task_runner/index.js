const debug = require('debug');
const log = debug('swf');

const { createTaskPoller } = require('../util/poller');

const { resolveDeciderFunction } = require('./resolve');
const { runDecider } = require('./run');
const { createDecisionTaskCompletedResponder } = require('./respond');
const {
    summarizeDecisions,
    summarizeError,
} = require('../util/logging');

function getMostRecentNonDecisionEvent(events) {
    const rx = /^Decision/;
    for (let i = events.length - 1; i >= 0; i--) {
        if (!rx.test(events[i].eventType)) {
            return events[i];
        }
    }
    return undefined;
}

/**
 * Starts a long-poller that processes decision tasks.
 */
function pollForAndRunDecisionTasks(options) {
    const {
        domain,
        emitter,
        identity,
        swfClient,
        taskList,
        workflowDefinitions,
    } = options;

    const poller = createTaskPoller({
        swfClient,
        method: 'pollForDecisionTask',
        params: {
            domain,
            taskList: {
                name: taskList,
            },
            identity,
        },
    });

    // Forward polling errors to the main emitter.
    poller.on('error', (err) => emitter.emit('error', err));

    poller.on('started', () => log('Polling for decision tasks...'));

    poller.on('timedOut', () => log('Decision task long polling timed out.'));

    poller.on('task', (task, continuePolling) => {
        const {
            events,
            workflowExecution: { workflowId },
        } = task;

        const workflowLog = debug(`swf:${workflowId}:decider`);

        const mostRecentEvent = getMostRecentNonDecisionEvent(events) || {};

        workflowLog(
            'Received decision task with %d event(s). Most recent non-decision event: %s (%s)',
            events.length,
            mostRecentEvent.eventType,
            mostRecentEvent.eventId
        );

        const handleCompletedDecisionTask = createDecisionTaskCompletedResponder(swfClient, task);

        resolveDeciderFunction(task, workflowDefinitions)
            .then(deciderFunc => runDecider(task, deciderFunc, workflowLog, options))
            .then(handleCompletedDecisionTask)
            .then((decisions) => {
                workflowLog(
                    'Decision task completed: %s',
                    decisions.length ? summarizeDecisions(decisions) : '(no decisions)'
                );
                continuePolling();
            })
            .catch(err => {
                if (workflowLog.enabled !== false) {
                    workflowLog('Decision task failed: %s', summarizeError(err));
                }
                emitter.emit('error', err);
                continuePolling();
            });
    });

    poller.start();

    return poller;
}

module.exports = { pollForAndRunDecisionTasks };
