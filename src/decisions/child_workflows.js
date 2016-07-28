const uuid = require('node-uuid');

const { normalizeNameAndVersion } = require('../util/name_and_version');
const { getLatestVersionForDefinitionNamed } = require('../util/version_resolution');
const JSONish = require('../util/jsonish');

function createChildWorkflowDecisionFunctions(options) {
    const { workflowDefinitions } = options;

    /**
     * Decision that asks to cancel a running workflow.
     */
    function requestCancelExternalWorkflowExecution(workflowId) {
        return {
            decisionType: 'RequestCancelExternalWorkflowExecution',
            requestCancelExternalWorkflowExecutionDecisionAttributes: {
                workflowId,
            },
        };
    }

    /**
     * Decision that starts a child workflow executing.
     */
    function startChildWorkflowExecution(type, id, input) {
        const workflowType = normalizeNameAndVersion(type);

        if (!workflowType.version) {
            // Assume the latest version of this activity.
            workflowType.version = getLatestVersionForDefinitionNamed(
                workflowType.name,
                workflowDefinitions
            );
        }

        const attrs = {
            workflowType,
            workflowId: id === undefined ? uuid.v4() : id,
            taskList: {
                name: options.taskList,
            },
        };

        if (input !== undefined) {
            attrs.input = JSONish.stringify(input);
        }

        return {
            decisionType: 'StartChildWorkflowExecution',
            startChildWorkflowExecutionDecisionAttributes: attrs,
        };
    }

    return {
        requestCancelExternalWorkflowExecution,
        startChildWorkflowExecution,
    };
}

module.exports = createChildWorkflowDecisionFunctions;
