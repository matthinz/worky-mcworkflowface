const debug = require('debug');

const { createTaskPoller } = require('../util/poller');

const { resolveDeciderFunction } = require('./resolve');
const { runDecider } = require('./run');
const { createDecisionTaskCompletedResponder } = require('./respond');
const { summarizeDecisions } = require('../util/logging');

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

    poller.on('task', (task, continuePolling) => {
        const {
            events,
            workflowExecution: { workflowId },
        } = task;

        const log = debug(`swf:${workflowId}:decider`);

        const mostRecentEvent = getMostRecentNonDecisionEvent(events) || {};

        log(
            'Received decision task with %d event(s). Most recent non-decision event: %s (%s)',
            events.length,
            mostRecentEvent.eventType,
            mostRecentEvent.eventId
        );

        const handleCompletedDecisionTask = createDecisionTaskCompletedResponder(swfClient, task);

        resolveDeciderFunction(task, workflowDefinitions)
            .then(deciderFunc => runDecider(task, deciderFunc, log, options))
            .then(handleCompletedDecisionTask)
            .then((decisions) => {
                log('Decision task completed: %s', summarizeDecisions(decisions));
                continuePolling();
            })
            .catch(err => {
                log('Decision task failed: %s.', err.message);
                emitter.emit('error', err);
                continuePolling();
            });
    });

    poller.start();
}

module.exports = { pollForAndRunDecisionTasks };
