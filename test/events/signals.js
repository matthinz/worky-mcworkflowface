const { expect } = require('chai');

const { distillSingleItem } = require('./helpers');

const signaledEvent = {
    eventType: 'WorkflowExecutionSignaled',
    eventTimestamp: '2016-06-15T20:18:55.502Z',
    workflowExecutionSignaledEventAttributes: {
        signalName: 'FooSignal',
        input: 'some input',
    },
};

describe('Event Distillation - Signals', () => {
    it('WorkflowExecutionSignaled', () => {
        const item = distillSingleItem([
            signaledEvent,
        ]);
        expect(item).to.deep.equal({
            type: 'signal',
            createdAt: '2016-06-15T20:18:55.502Z',
            signalName: 'FooSignal',
            input: 'some input',
        });
    });
});
