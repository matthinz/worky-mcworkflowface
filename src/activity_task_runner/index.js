const debug = require('debug');
const log = debug('swf');

const { createTaskPoller } = require('../util/poller');
const { summarizeError } = require('../util/logging');

const { resolveActivityTaskFunction } = require('./resolve');
const { runActivityTaskFunction } = require('./run');
const {
    createActivitySuccessResponder,
    createActivityFailureResponder,
} = require('./respond');

/**
 * Starts a long-poller that processes decision tasks.
 */
function pollForAndRunActivityTasks({
    swfClient,
    domain,
    activityTaskDefinitions,
    taskList,
    identity,
    emitter,
}) {
    const poller = createTaskPoller({
        swfClient,
        method: 'pollForActivityTask',
        params: {
            domain,
            taskList: {
                name: taskList,
            },
            identity,
        },
    });

    poller.on('error', (err) => emitter.emit('error', err));

    poller.on('started', () => log('Polling for activity tasks...'));

    poller.on('timedOut', () => log('Activity task long polling timed out.'));

    poller.on('task', (task, continuePolling) => {
        // Logging is done in the context of a task being executed
        const {
            activityId,
            workflowExecution: { workflowId },
            activityType: { name },
        } = task;

        const workflowLog = debug(`swf:${workflowId}:${name}:${activityId}`);
        workflowLog('Received activity task');

        resolveActivityTaskFunction(task, activityTaskDefinitions)
        .then((func) => {
            workflowLog('Running activity task function');
            return runActivityTaskFunction(task, func);
        })
        .then(
            createActivitySuccessResponder(swfClient, task.taskToken, emitter),
            createActivityFailureResponder(swfClient, task.taskToken, emitter)
        )
        .then(() => {
            workflowLog('Activity completed.');
            continuePolling();
        })
        .catch(err => {
            if (workflowLog.enabled !== false) {
                workflowLog('Activity failed: %s', summarizeError(err));
            }
            continuePolling();
        });
    });

    poller.start();

    return poller;
}

module.exports = {
    pollForAndRunActivityTasks,
};
