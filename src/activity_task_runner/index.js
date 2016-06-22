const debug = require('debug');

const { createTaskPoller } = require('../util/poller');

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

    poller.on('task', (task, continuePolling) => {
        // Logging is done in the context of a task being executed
        const {
            activityId,
            workflowExecution: { workflowId },
            activityType: { name },
        } = task;

        const log = debug(`swf:${workflowId}:${name}:${activityId}`);
        log('Received activity task');

        resolveActivityTaskFunction(task, activityTaskDefinitions)
        .then((func) => {
            log('Running activity task function');
            return runActivityTaskFunction(task, func);
        })
        .then(
            createActivitySuccessResponder(swfClient, task.taskToken),
            createActivityFailureResponder(swfClient, task.taskToken)
        )
        .then(() => {
            log('Activity completed.');
            continuePolling();
        })
        .catch(err => {
            log('Activity failed: %s', err.message);
            emitter.emit('error', err);
            continuePolling();
        });
    });

    poller.start();
}

module.exports = {
    pollForAndRunActivityTasks,
};
