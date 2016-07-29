const { expect } = require('chai');

const {
    distillSingleItem,
} = require('./helpers');

const scheduleFailedEvent = {
    eventType: 'ScheduleActivityTaskFailed',
    eventTimestamp: '2016-06-14T19:03:15.997Z',
    scheduleActivityTaskFailedEventAttributes: {
        activityType: {
            name: 'FooActivity',
            version: '1.2',
        },
        cause: 'ACTIVITY_TYPE_DOES_NOT_EXIST',
    },
};

const scheduledEvent = {
    eventType: 'ActivityTaskScheduled',
    eventId: 100,
    eventTimestamp: '2016-06-14T19:04:15.997Z',
    activityTaskScheduledEventAttributes: {
        activityType: {
            name: 'FooActivity',
            version: '1.2',
        },
        activityId: 'my_foo_activity',
        input: '"ABCD1234"',
    },
};

const cancelRequestedEvent = {
    eventType: 'ActivityTaskCancelRequested',
    eventTimestamp: '2016-06-14T19:05:15.997Z',
    activityTaskCancelRequestedEventAttributes: {
        activityId: 'my_foo_activity',
    },
};

const canceledEvent = {
    eventType: 'ActivityTaskCanceled',
    eventTimestamp: '2016-06-14T19:06:15.997Z',
    activityTaskCanceledEventAttributes: {
        scheduledEventId: 100,
    },
};

const startedEvent = {
    eventType: 'ActivityTaskStarted',
    eventTimestamp: '2016-06-14T19:06:15.997Z',
    activityTaskStartedEventAttributes: {
        scheduledEventId: 100,
    },
};

const completedEvent = {
    eventType: 'ActivityTaskCompleted',
    activityTaskCompletedEventAttributes: {
        scheduledEventId: 100,
        result: '{"foo":"bar"}',
    },
};

const failedEvent = {
    eventType: 'ActivityTaskFailed',
    activityTaskFailedEventAttributes: {
        reason: 'reason',
        details: 'here are details',
        scheduledEventId: 100,
    },
};

const timedOutEvent = {
    eventType: 'ActivityTaskTimedOut',
    activityTaskTimedOutEventAttributes: {
        scheduledEventId: 100,
        timeoutType: 'START_TO_CLOSE',
    },
};


describe('Event Distillation - activity items', () => {
    it('ScheduleActivityTaskFailed', () => {
        const item = distillSingleItem([
            scheduleFailedEvent,
        ]);
        expect(item).to.deep.equal({
            type: 'activity',
            name: 'FooActivity',
            version: '1.2',
            error: {
                code: 'ACTIVITY_TYPE_DOES_NOT_EXIST',
                message: 'ACTIVITY_TYPE_DOES_NOT_EXIST',
            },
            canceled: false,
            cancelRequested: false,
            inProgress: false,
            started: false,
            success: false,
        });
    });

    it('ActivityTaskScheduled', () => {
        const item = distillSingleItem([
            scheduledEvent,
        ]);

        expect(item).to.deep.equal({
            type: 'activity',
            name: 'FooActivity',
            activityId: 'my_foo_activity',
            version: '1.2',
            canceled: false,
            cancelRequested: false,
            started: false,
            inProgress: true,
            input: 'ABCD1234',
        });
    });
    it('ActivityTaskStarted', () => {
        const item = distillSingleItem([
            scheduledEvent,
            startedEvent,
        ]);
        expect(item).to.deep.equal({
            type: 'activity',
            name: 'FooActivity',
            version: '1.2',
            activityId: 'my_foo_activity',
            canceled: false,
            cancelRequested: false,
            started: true,
            startedAt: '2016-06-14T19:06:15.997Z',
            inProgress: true,
            input: 'ABCD1234',
        });
    });
    it('ActivityTaskCancelRequested', () => {
        const item = distillSingleItem([
            scheduledEvent,
            startedEvent,
            cancelRequestedEvent,
        ]);
        expect(item).to.deep.equal({
            type: 'activity',
            name: 'FooActivity',
            version: '1.2',
            activityId: 'my_foo_activity',
            canceled: false,
            cancelRequested: true,
            started: true,
            startedAt: '2016-06-14T19:06:15.997Z',
            inProgress: true,
            input: 'ABCD1234',
        });
    });

    it('ActivityTaskCanceled', () => {
        const item = distillSingleItem([
            scheduledEvent,
            startedEvent,
            cancelRequestedEvent,
            canceledEvent,
        ]);
        expect(item).to.deep.equal({
            type: 'activity',
            name: 'FooActivity',
            version: '1.2',
            activityId: 'my_foo_activity',
            canceled: true,
            cancelRequested: true,
            started: true,
            startedAt: '2016-06-14T19:06:15.997Z',
            inProgress: false,
            input: 'ABCD1234',
        });
    });
    it('ActivityTaskCompleted', () => {
        const item = distillSingleItem([
            scheduledEvent,
            startedEvent,
            completedEvent,
        ]);
        expect(item).to.deep.equal({
            type: 'activity',
            name: 'FooActivity',
            version: '1.2',
            activityId: 'my_foo_activity',
            canceled: false,
            cancelRequested: false,
            started: true,
            startedAt: '2016-06-14T19:06:15.997Z',
            inProgress: false,
            input: 'ABCD1234',
            success: true,
            result: {
                foo: 'bar',
            },
        });
    });
    it('ActivityTaskFailed', () => {
        const item = distillSingleItem([
            scheduledEvent,
            startedEvent,
            failedEvent,
        ]);
        expect(item).to.deep.equal({
            type: 'activity',
            name: 'FooActivity',
            version: '1.2',
            activityId: 'my_foo_activity',
            canceled: false,
            cancelRequested: false,
            started: true,
            startedAt: '2016-06-14T19:06:15.997Z',
            error: {
                code: 'reason',
                message: 'here are details',
            },
            inProgress: false,
            input: 'ABCD1234',
            success: false,
        });
    });
    it('ActivityTaskTimedOut', () => {
        const item = distillSingleItem([
            scheduledEvent,
            startedEvent,
            timedOutEvent,
        ]);
        expect(item).to.deep.equal({
            type: 'activity',
            name: 'FooActivity',
            version: '1.2',
            activityId: 'my_foo_activity',
            canceled: false,
            cancelRequested: false,
            started: true,
            startedAt: '2016-06-14T19:06:15.997Z',
            error: {
                code: 'TIMED_OUT',
                message: 'Activity timed out (START_TO_CLOSE)',
            },
            inProgress: false,
            input: 'ABCD1234',
            success: false,
        });
    });
});
