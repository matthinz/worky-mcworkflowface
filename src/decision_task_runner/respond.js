/**
 * Returns a function that can be used to mark a decision task as complete.
 */
function createDecisionTaskCompletedResponder(swfClient, task, emitter) {
    return function decisionTaskCompleteResponder(decisions) {
        const params = {
            taskToken: task.taskToken,
            decisions,
        };
        return new Promise((resolve, reject) => {
            swfClient.respondDecisionTaskCompleted(params, (err) => {
                if (err) {
                    emitter.emit('error', err);
                    reject(err);
                    return;
                }
                resolve(decisions);
            });
        });
    };
}

module.exports = {
    createDecisionTaskCompletedResponder,
};
