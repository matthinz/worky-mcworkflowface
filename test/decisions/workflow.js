const { expect } = require('chai');

const { createDecisionFunctions } = require('../../src/decisions');

describe('workflow decision helpers', () => {
    const {
        completeWorkflowExecution,
        continueAsNewWorkflowExecution,
        failWorkflowExecution,
    } = createDecisionFunctions({
        taskList: 'foo-task-list',
    });

    describe('completeWorkflowExecution()', () => {
        it('marks workflow as completed', () => {
            expect(completeWorkflowExecution()).to.deep.equal({
                decisionType: 'CompleteWorkflowExecution',
            });
        });
    });

    describe('continueAsNewWorkflowExecution()', () => {
        it('accepts input', () => {
            const decision = continueAsNewWorkflowExecution({ foo: 'bar' });
            expect(decision).to.have.property('continueAsNewWorkflowExecutionDecisionAttributes');
            const attrs = decision.continueAsNewWorkflowExecutionDecisionAttributes;
            expect(attrs).to.have.property('input').equal('{"foo":"bar"}');
        });
        it('uses taskList from options', () => {
            const decision = continueAsNewWorkflowExecution({ foo: 'bar' });
            const attrs = decision.continueAsNewWorkflowExecutionDecisionAttributes;
            expect(attrs).to.have.property('taskList').deep.equal({
                name: 'foo-task-list',
            });
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
