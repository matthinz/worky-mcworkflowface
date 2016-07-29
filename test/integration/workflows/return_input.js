module.exports = {
    name: 'ReturnInput',
    versions: {
        '1.0': {
            decider(items, availableDecisions) {
                const { completeWorkflowExecution } = availableDecisions;
                const { input } = items[0];
                return completeWorkflowExecution(input);
            },
        },
    },
};
