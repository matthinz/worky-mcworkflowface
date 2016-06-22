const { formatErrorForSwf } = require('../util/format_error');

function completeWorkflow() {
    return {
        decisionType: 'CompleteWorkflowExecution',
    };
}

function continueAsNewWorkflowExecution(input) {
    return {
        decisionType: 'ContinueAsNewWorkflowExecution',
        continueAsNewWorkflowExecutionDecisionAttributes: {
            input,
            taskList: {
                name: 'worker',
            },
        },
    };
}

function failWorkflowExecution(err) {
    return {
        decisionType: 'FailWorkflowExecution',
        failWorkflowExecutionDecisionAttributes: formatErrorForSwf(err),
    };
}

module.exports = {
    completeWorkflow,
    continueAsNewWorkflowExecution,
    failWorkflowExecution,
};
