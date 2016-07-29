const { expect } = require('chai');

const { createDecisionFunctions } = require('../../../src/decisions');

const workflowDefinitions = [
    {
        name: 'MyWorkflow',
        versions: {
            '1.0': { },
            '2.0': { },
        },
    },
];

const decisionFunctions = createDecisionFunctions({
    workflowDefinitions,
    taskList: 'MyTaskList',
});

const {
    startChildWorkflowExecution,
    requestCancelExternalWorkflowExecution,
} = decisionFunctions;

describe('startChildWorkflowExecution()', () => {
    it('accepts just workflow name', () => {
        const decision = startChildWorkflowExecution('MyWorkflow');
        expect(decision).to.have.property('decisionType', 'StartChildWorkflowExecution');

        const attrs = decision.startChildWorkflowExecutionDecisionAttributes;
        expect(attrs).to.have.property('workflowType').deep.equal({
            name: 'MyWorkflow',
            version: '2.0',
        });
        expect(attrs).to.have.property('workflowId').match(/.+/);
        expect(attrs).not.to.have.property('input');
        expect(attrs).to.have.property('taskList').deep.equal({
            name: 'MyTaskList',
        });
    });

    it('accepts a workflow id', () => {
        const decision = startChildWorkflowExecution('MyWorkflow', 'myworkflow-with-an-id');
        expect(decision).to.have.property('decisionType', 'StartChildWorkflowExecution');

        const attrs = decision.startChildWorkflowExecutionDecisionAttributes;
        expect(attrs).to.have.property('workflowId', 'myworkflow-with-an-id');
    });

    it('converts input to JSON', () => {
        const decision = startChildWorkflowExecution('MyWorkflow', 'some-id', 'here is some input');
        const attrs = decision.startChildWorkflowExecutionDecisionAttributes;
        expect(attrs).to.have.property('input', '"here is some input"');
    });
});

describe('requestCancelExternalWorkflowExecution()', () => {
    it('accepts workflow id', () => {
        const decision = requestCancelExternalWorkflowExecution('some-id');
        expect(decision).to.deep.equal({
            decisionType: 'RequestCancelExternalWorkflowExecution',
            requestCancelExternalWorkflowExecutionDecisionAttributes: {
                workflowId: 'some-id',
            },
        });
    });
});
