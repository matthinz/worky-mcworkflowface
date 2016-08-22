const {
    summarizeDecisions,
    summarizeError,
} = require('../util/logging');

/**
 * Returns a function that logs a decision task failure.
 */
function createDecisionTaskFailureResponder(swfClient, task, log) {
    return function decisionTaskFailureResponder(err) {
        // NOTE: There's no `respondDecisionTaskFailed()` API. When decision tasks fail, they just
        //       time out and are retried.
        if (log.enabled) {
            log('Decision task failed: %s', summarizeError(err));
        }
    };
}

/**
 * Returns a function that can be used to mark a decision task as complete.
 */
function createDecisionTaskCompletedResponder(swfClient, task, log) {
    return function decisionTaskCompleteResponder(decisions) {
        if (log.enabled) {
            log(
                'Decision task completed: %s',
                decisions.length ? summarizeDecisions(decisions) : '(no decisions)'
            );
        }

        const params = {
            taskToken: task.taskToken,
            decisions,
        };

        return new Promise((resolve) => {
            swfClient.respondDecisionTaskCompleted(params, (err) => {
                if (err && log.enabled) {
                    log('Error during respondDecisionTaskCompleted: %s', summarizeError(err));
                }

                resolve();
            });
        });
    };
}

module.exports = {
    createDecisionTaskCompletedResponder,
    createDecisionTaskFailureResponder,
};
