module.exports = {
    name: 'FailFirstTime',
    versions: {
        '1.0': {
            decider(items, availableDecisions) {
                const {
                    completeWorkflowExecution,
                    failWorkflowExecution,
                } = availableDecisions;

                const { input } = items[0];

                if (input && input.iteration > 0) {
                    // Not the first time, so succeed
                    return completeWorkflowExecution();
                }

                const err = new Error('First execution fails');
                err.code = 'EFIRSTTIME';

                return failWorkflowExecution(err);
            },
            settings: {
                defaultExecutionStartToCloseTimeout: 60,
                defaultTaskStartToCloseTimeout: 'NONE',
                defaultChildPolicy: 'TERMINATE',
            },
        },
    },
};
