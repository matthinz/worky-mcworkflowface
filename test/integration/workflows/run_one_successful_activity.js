module.exports = {
    name: 'RunOneSuccessfulActivity',
    versions: {
        '1.0': {
            decider(items, availableDecisions) {
                const {
                    completeWorkflowExecution,
                    failWorkflowExecution,
                    startActivity,
                } = availableDecisions;

                const workflow = items.find(i => i.type === 'workflow');
                const activity = items.find(i => i.type === 'activity');

                if (!activity) {
                    return startActivity('Ping', workflow.input);
                }

                if (activity.success) {
                    return completeWorkflowExecution(activity.result);
                }

                if (activity.error) {
                    return failWorkflowExecution(activity.error);
                }

                return [];
            },
        },
    },
};
