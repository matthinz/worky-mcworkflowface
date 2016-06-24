const { formatErrorForSwf } = require('../util/format_error');

function createWorkflowDecisionFunctions(options) {
    function completeWorkflowExecution() {
        return {
            decisionType: 'CompleteWorkflowExecution',
        };
    }

    function continueAsNewWorkflowExecution(input) {
        return {
            decisionType: 'ContinueAsNewWorkflowExecution',
            continueAsNewWorkflowExecutionDecisionAttributes: {
                input: JSON.stringify(input),
                taskList: {
                    name: options.taskList,
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

    return {
        completeWorkflowExecution,
        continueAsNewWorkflowExecution,
        failWorkflowExecution,
    };
}

module.exports = createWorkflowDecisionFunctions;
