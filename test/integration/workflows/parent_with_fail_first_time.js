module.exports = {
    name: 'ParentWithFailFirstTime',
    versions: {
        '1.0': {
            decider(items, availableDecisions) {
                const {
                    completeWorkflowExecution,
                    startChildWorkflowExecution,
                } = availableDecisions;

                const children = items.filter(i => i.type === 'child_workflow');
                const child = children[children.length - 1];

                if (child && child.success) {
                    return completeWorkflowExecution();
                }

                if (child && child.inProgress) {
                    return [];
                }

                return startChildWorkflowExecution('FailFirstTime', `FailFirstTime-${Date.now()}`, {
                    iteration: children.length,
                });
            },
        },
    },
};
