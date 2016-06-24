const { formatErrorForSwf } = require('../util/format_error');

function completeWorkflowExecution() {
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
    completeWorkflowExecution,
    continueAsNewWorkflowExecution,
    failWorkflowExecution,
};
