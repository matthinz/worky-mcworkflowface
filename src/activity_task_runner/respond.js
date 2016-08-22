const { formatErrorForSwf } = require('../util/format_error');
const { summarizeError } = require('../util/logging');

/**
 * Generates a function that can be used to report an activity task's success back to AWS.
 */
function createActivitySuccessResponder(swfClient, taskToken, log) {
    return function activitySuccessResponder(result) {
        const params = {
            taskToken,
            result,
        };
        return new Promise((resolve) => {
            swfClient.respondActivityTaskCompleted(params, err => {
                if (err && log.enabled) {
                    log('Error during respondActivityTaskCompleted: %s', summarizeError(err));
                    // NOTE: Falling through on purpose here.
                }

                resolve(result);
            });
        });
    };
}

/**
 * Generates a function that can be used to report an activity task's failure back to AWS.
 */
function createActivityFailureResponder(swfClient, taskToken, log) {
    return function activityFailureResponder(err) {
        if (log.enabled) {
            log('Activity task failed: %s', summarizeError(err));
        }

        const params = Object.assign(
            {},
            formatErrorForSwf(err),
            {
                taskToken,
            }
        );

        return new Promise((resolve) => {
            swfClient.respondActivityTaskFailed(params, (awsError) => {
                if (awsError && log.enabled) {
                    log('Error during respondActivityTaskFailed: %s', summarizeError(awsError));
                }
                resolve();
            });
        });
    };
}

module.exports = {
    createActivitySuccessResponder,
    createActivityFailureResponder,
};
