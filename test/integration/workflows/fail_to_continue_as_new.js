// This workflow generates a "ContinueAsNewWorkflowExecutionFailed" event.
module.exports = {
    name: 'FailToContinueAsNew',
    versions: {
        '1.0': {
            decider(items, availableDecisions) {
                const {
                    completeWorkflowExecution,
                    continueAsNewWorkflowExecution,
                    failWorkflowExecution,
                    startActivity,
                    startTimer,
                } = availableDecisions;

                if (items.length === 1) {
                    return [
                        startTimer('timer', 3),
                        startActivity('Wait', 10),
                    ];
                }

                const timer = items.find(i => i.type === 'timer');
                const activity = items.find(i => i.type === 'activity');

                if (timer.fired && !activity.inProgress) {
                    return completeWorkflowExecution();
                }

                if (!activity.inProgress) {
                    return failWorkflowExecution();
                }

                // while a timer is running, try to continue as new
                // this should fail.
                return continueAsNewWorkflowExecution();
            },
            settings: {
                defaultExecutionStartToCloseTimeout: 60,
                defaultTaskStartToCloseTimeout: 3,
            },
        },
    },
};
