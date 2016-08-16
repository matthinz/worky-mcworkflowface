const { formatErrorForSwf } = require('../util/format_error');

/**
 * Generates a function that can be used to report an activity task's success back to AWS.
 */
function createActivitySuccessResponder(swfClient, taskToken, emitter) {
    return function activitySuccessResponder(result) {
        const params = {
            taskToken,
            result,
        };
        return new Promise((resolve, reject) => {
            swfClient.respondActivityTaskCompleted(params, err => {
                if (err) {
                    emitter.emit('error', err);
                    reject(err);
                    return;
                }
                resolve(result);
            });
        });
    };
}

/**
 * Generates a function that can be used to report an activity task's failure back to AWS.
 */
function createActivityFailureResponder(swfClient, taskToken, emitter) {
    return function activityFailureResponder(err) {
        const params = Object.assign(
            {},
            formatErrorForSwf(err),
            {
                taskToken,
            }
        );
        return new Promise((resolve, reject) => {
            swfClient.respondActivityTaskFailed(params, (awsError) => {
                // Favor returning our *original* error rather than any AWS error here since the
                // original error is likely more interesting.

                if (awsError) {
                    emitter.emit('error', awsError);
                }

                reject(err);
            });
        });
    };
}

module.exports = {
    createActivitySuccessResponder,
    createActivityFailureResponder,
};
