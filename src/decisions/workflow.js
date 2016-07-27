const JSONish = require('../util/jsonish');
const { formatErrorForSwf } = require('../util/format_error');

function createWorkflowDecisionFunctions(options) {
    function completeWorkflowExecution(result) {
        const decision = {
            decisionType: 'CompleteWorkflowExecution',
        };

        if (result !== undefined) {
            decision.completeWorkflowExecutionDecisionAttributes = {
                result: JSONish.stringify(result),
            };
        }

        return decision;
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
