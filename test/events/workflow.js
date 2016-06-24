const { expect } = require('chai');
const { distillEventsIntoItems } = require('../../src/events');

describe('Event Log Distillation - Workflow Type', () => {
    it('WorkflowExecutionStarted', () => {
        const rawEvents = [
            {
                eventTimestamp: '2016-06-08T21:58:42.051Z',
                eventType: 'WorkflowExecutionStarted',
                workflowExecutionStartedEventAttributes: {
                    input: '{"foo":"bar"}',
                },
            },
            {
                type: 'DecisionTaskScheduled',
            },
        ];
        const events = distillEventsIntoItems(rawEvents);

        expect(events).to.have.length(1);
        const ev = events[0];

        expect(ev).to.have.property('type', 'workflow');

        expect(ev).to.have.property('started', true);
        expect(ev).to.have.property('startedAt');
        expect(ev.startedAt.toISOString()).to.equal('2016-06-08T21:58:42.051Z');

        expect(ev).to.have.property('input').deep.equal({ foo: 'bar' });

        expect(ev).not.to.have.property('completed');
        expect(ev).not.to.have.property('error');
    });
    it('WorkflowExecutionCompleted', () => {
        const rawEvents = [
            {
                eventTimestamp: '2016-06-08T21:58:42.051Z',
                eventType: 'WorkflowExecutionStarted',
                workflowExecutionStartedEventAttributes: {
                    input: '{"foo":"bar"}',
                },
            },
            {
                type: 'DecisionTaskScheduled',
            },
            {
                eventTimestamp: '2016-06-09T21:58:42.051Z',
                eventType: 'WorkflowExecutionCompleted',
                workflowExecutionCompletedEventAttributes: {
                    result: 'BazBat',
                },
            },
        ];
        const events = distillEventsIntoItems(rawEvents);

        expect(events).to.have.length(1);
        const ev = events[0];

        expect(ev).to.have.property('type', 'workflow');

        expect(ev).to.have.property('started', true);
        expect(ev).to.have.property('startedAt');
        expect(ev.startedAt.toISOString()).to.equal('2016-06-08T21:58:42.051Z');

        expect(ev).to.have.property('finished', true);
        expect(ev).to.have.property('finishedAt');
        expect(ev.finishedAt.toISOString()).to.equal('2016-06-09T21:58:42.051Z');

        expect(ev).to.have.property('input').deep.equal({ foo: 'bar' });
        expect(ev).to.have.property('result', 'BazBat');

        expect(ev).not.to.have.property('error');
    });
});
