const { assert, expect } = require('chai');

const {
    distillSingleItem,
    shouldBeUnhandled,
} = require('./helpers');

describe('Event Distillation - Timer Items', () => {
    it('TimerStarted', () => {
        const item = distillSingleItem([
            {
                eventType: 'TimerStarted',
                eventTimestamp: '2016-06-14T17:39:32.987Z',
                timerStartedEventAttributes: {
                    timerId: 'foobarbaz',
                    startToFireTimeout: '30',
                },
            },
        ]);
        expect(item).to.deep.equal({
            type: 'timer',
            timerId: 'foobarbaz',
            canceled: false,
            cancelRequested: false,
            fired: false,
            inProgress: true,
            started: true,
            startedAt: '2016-06-14T17:39:32.987Z',
        });
    });

    it('StartTimerFailed', () => {
        shouldBeUnhandled([
            {
                eventType: 'StartTimerFailed',
                eventTimestamp: '2016-06-14T17:39:32.987Z',
                startTimerFailedEventAttributes: {
                    timerId: 'foobarbaz',
                    cause: 'TIMER_ID_ALREADY_IN_USE',
                },
            },
        ]);
    });

    it('TimerCanceled', () => {
        const item = distillSingleItem([
            {
                eventId: '12345',
                eventType: 'TimerStarted',
                eventTimestamp: '2016-06-14T17:39:32.987Z',
                timerStartedEventAttributes: {
                    timerId: 'foobarbaz',
                    startToFireTimeout: '30',
                },
            },
            {
                eventType: 'TimerCanceled',
                eventTimestamp: '2016-06-14T17:59:32.987Z',
                timerCanceledEventAttributes: {
                    timerId: 'foobarbaz',
                    startedEventId: '12345',
                },
            },
        ]);
        expect(item).to.deep.equal({
            type: 'timer',
            timerId: 'foobarbaz',
            canceled: true,
            cancelRequested: true,
            canceledAt: '2016-06-14T17:59:32.987Z',
            fired: false,
            inProgress: false,
            started: true,
            startedAt: '2016-06-14T17:39:32.987Z',
        });
    });

    it('TimerFired', () => {
        const item = distillSingleItem([
            {
                eventId: '12345',
                eventType: 'TimerStarted',
                eventTimestamp: '2016-06-14T17:39:32.987Z',
                timerStartedEventAttributes: {
                    timerId: 'foobarbaz',
                    startToFireTimeout: '30',
                },
            },
            {
                eventType: 'TimerFired',
                eventTimestamp: '2016-06-14T17:59:32.987Z',
                timerFiredEventAttributes: {
                    timerId: 'foobarbaz',
                    startedEventId: '12345',
                },
            },
        ]);
        expect(item).to.deep.equal({
            type: 'timer',
            timerId: 'foobarbaz',
            canceled: false,
            cancelRequested: false,
            fired: true,
            firedAt: '2016-06-14T17:59:32.987Z',
            inProgress: false,
            started: true,
            startedAt: '2016-06-14T17:39:32.987Z',
        });
    });
    it('CancelTimerFailed', () => {
        shouldBeUnhandled([
            {
                eventId: '12345',
                eventType: 'TimerStarted',
                eventTimestamp: '2016-06-14T17:39:32.987Z',
                timerStartedEventAttributes: {
                    timerId: 'foobarbaz',
                    startToFireTimeout: '30',
                },
            },
            {
                eventType: 'CancelTimerFailed',
                eventTimestamp: '2016-06-14T17:59:32.987Z',
                cancelTimerFailedEventAttributes: {
                    timerId: 'foobarbaz',
                    cause: 'TIMER_ID_UNKNOWN',
                },
            },
        ]);
    });
});
