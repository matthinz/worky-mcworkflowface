const { expect } = require('chai');
const { distillSingleItem } = require('./helpers');

describe('Event Log Distillation - Workflow Type', () => {
    const startedEvent = {
        eventTimestamp: '2016-06-08T21:58:42.051Z',
        eventType: 'WorkflowExecutionStarted',
        workflowExecutionStartedEventAttributes: {
            input: '{"foo":"bar"}',
        },
    };

    const cancelRequestedEvent = {
        eventTimestamp: '2016-06-08T21:59:42.051Z',
        eventType: 'WorkflowExecutionCancelRequested',
    };

    const completedEvent = {
        eventTimestamp: '2016-06-09T21:58:42.051Z',
        eventType: 'WorkflowExecutionCompleted',
        workflowExecutionCompletedEventAttributes: {
            result: '"BazBat"',
        },
    };

    it('WorkflowExecutionStarted', () => {
        const item = distillSingleItem([
            startedEvent,
        ]);

        expect(item).to.deep.equal({
            type: 'workflow',
            canceled: false,
            cancelRequested: false,
            error: false,
            input: {
                foo: 'bar',
            },
            started: true,
            startedAt: '2016-06-08T21:58:42.051Z',
        });
    });
    it('WorkflowExecutionCompleted', () => {
        const item = distillSingleItem([
            startedEvent,
            completedEvent,
        ]);

        expect(item).to.deep.equal({
            type: 'workflow',
            canceled: false,
            cancelRequested: false,
            error: false,
            input: {
                foo: 'bar',
            },
            started: true,
            startedAt: '2016-06-08T21:58:42.051Z',
            result: 'BazBat',
        });
    });
    it('WorkflowExecutionCancelRequested', () => {
        const item = distillSingleItem([
            startedEvent,
            cancelRequestedEvent,
        ]);

        expect(item).to.deep.equal({
            type: 'workflow',
            canceled: false,
            cancelRequested: true,
            error: false,
            input: {
                foo: 'bar',
            },
            started: true,
            startedAt: '2016-06-08T21:58:42.051Z',
        });
    });
});
