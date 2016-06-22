/* eslint-disable no-param-reassign */

module.exports = {
    ScheduleActivityTaskFailed(event, state, items) {
        const attrs = event.scheduleActivityTaskFailedEventAttributes;
        const activityItem = {
            type: 'activity',
            name: attrs.activityType.name,
            version: attrs.activityType.version,
            canceled: false,
            cancelRequested: false,
            createdAt: new Date(event.eventTimestamp),
            error: {
                code: attrs.cause,
                message: attrs.cause,
            },
            inProgress: false,
            success: false,
        };
        items.push(activityItem);
    },
    ActivityTaskScheduled(event, state, items) {
        const attrs = event.activityTaskScheduledEventAttributes;
        const activityItem = {
            type: 'activity',
            name: attrs.activityType.name,
            version: attrs.activityType.version,
            activityId: attrs.activityId,
            canceled: false,
            cancelRequested: false,
            createdAt: new Date(event.eventTimestamp),
            inProgress: true,
            input: attrs.input,
        };
        items.push(activityItem);

        // Store item by activityId (used by ActivityTaskCancelRequested)
        if (!state.activityItemsByActivityId) {
            state.activityItemsByActivityId = {};
        }
        state.activityItemsByActivityId[attrs.activityId] = activityItem;

        // Store item by schedule event id (for all other events)
        if (!state.activityItemsByScheduledEventId) {
            state.activityItemsByScheduledEventId = {};
        }
        state.activityItemsByScheduledEventId[event.eventId] = activityItem;
    },
    ActivityTaskCancelRequested(event, state) {
        const attrs = event.activityTaskCancelRequestedEventAttributes;
        // Look up activity item by schedule id
        const activityItem = state.activityItemsByActivityId[attrs.activityId];
        // Mark it as having had a cancel requested.
        activityItem.cancelRequested = true;
    },
    ActivityTaskCanceled(event, state) {
        const attrs = event.activityTaskCanceledEventAttributes;
        const activityItem = state.activityItemsByScheduledEventId[attrs.scheduledEventId];
        activityItem.canceled = true;
        activityItem.inProgress = false;
    },
    ActivityTaskStarted(event, state) {
        const attrs = event.activityTaskStartedEventAttributes;
        const activityItem = state.activityItemsByScheduledEventId[attrs.scheduledEventId];
        activityItem.inProgress = true;
    },
    ActivityTaskCompleted(event, state) {
        const attrs = event.activityTaskCompletedEventAttributes;
        const activityItem = state.activityItemsByScheduledEventId[attrs.scheduledEventId];

        activityItem.inProgress = false;
        activityItem.success = true;
        activityItem.result = attrs.result;
    },
    ActivityTaskFailed(event, state) {
        const attrs = event.activityTaskFailedEventAttributes;
        const activityItem = state.activityItemsByScheduledEventId[attrs.scheduledEventId];

        activityItem.inProgress = false;
        activityItem.success = false;
        activityItem.error = {
            code: attrs.reason,
            message: attrs.details,
        };
    },
    ActivityTaskTimedOut(event, state) {
        const attrs = event.activityTaskTimedOutEventAttributes;
        const activityItem = state.activityItemsByScheduledEventId[attrs.scheduledEventId];

        activityItem.inProgress = false;
        activityItem.success = false;
        activityItem.error = {
            code: 'TIMED_OUT',
            message: `Activity timed out (${attrs.timeoutType})`,
        };
    },
};
