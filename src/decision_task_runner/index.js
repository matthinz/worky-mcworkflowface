const debug = require('debug');
const log = debug('swf');

const { createTaskPoller } = require('../util/poller');

const { resolveDeciderFunction } = require('./resolve');
const { runDecider } = require('./run');
const {
    createDecisionTaskCompletedResponder,
    createDecisionTaskFailureResponder,
} = require('./respond');

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

    poller.on('started', () => log('Polling for decision tasks...'));

    poller.on('timedOut', () => log('Decision task long polling timed out.'));

    poller.on('task', (task, continuePolling) => {
        const {
            events,
            workflowExecution: { workflowId },
        } = task;

        const workflowLog = debug(`swf:${workflowId}:decider`);

        const handleCompletedDecisionTask = createDecisionTaskCompletedResponder(
            swfClient,
            task,
            workflowLog
        );

        const handleFailedDecisionTask = createDecisionTaskFailureResponder(
            swfClient,
            task,
            workflowLog
        );

        if (workflowLog.enabled) {
            const mostRecentEvent = getMostRecentNonDecisionEvent(events) || {};
            workflowLog(
                'Received decision task with %d event(s). Most recent non-decision event: %s (%s)',
                events.length,
                mostRecentEvent.eventType,
                mostRecentEvent.eventId
            );
        }

        resolveDeciderFunction(task, workflowDefinitions)
            .then(deciderFunc => runDecider(task, deciderFunc, workflowLog, options))
            .then(handleCompletedDecisionTask, handleFailedDecisionTask)
            .then(continuePolling);
    });

    poller.start();

    return poller;
}

module.exports = { pollForAndRunDecisionTasks };
