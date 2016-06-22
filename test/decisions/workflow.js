const { expect } = require('chai');

const { createDecisionFunctions } = require('../../src/decisions');

describe('workflow decision helpers', () => {
    const {
        completeWorkflow,
        failWorkflowExecution,
    } = createDecisionFunctions({});

    it('marks workflow as completed', () => {
        expect(completeWorkflow()).to.deep.equal({
            decisionType: 'CompleteWorkflowExecution',
        });
    });
    describe('failWorkflowExecution()', () => {
        it('supports Errors', () => {
            const err = new Error('Some error message');
            expect(failWorkflowExecution(err)).to.deep.equal({
                decisionType: 'FailWorkflowExecution',
                failWorkflowExecutionDecisionAttributes: {
                    reason: 'Error',
                    details: 'Some error message',
                },
            });
        });
        it('supports Errors with codes', () => {
            const err = new Error('Some error message');
            err.code = 'ECODE';
            expect(failWorkflowExecution(err)).to.deep.equal({
                decisionType: 'FailWorkflowExecution',
                failWorkflowExecutionDecisionAttributes: {
                    reason: 'ECODE',
                    details: 'Some error message',
                },
            });
        });
    });
});
