/* eslint-disable no-param-reassign */
module.exports = {
    TimerStarted(event, state, items) {
        const timerItem = {
            type: 'timer',
            canceled: false,
            cancelRequested: false,
            fired: false,
            inProgress: true,
            started: true,
            startedAt: new Date(event.eventTimestamp),
            timerId: event.timerStartedEventAttributes.timerId,
        };
        items.push(timerItem);

        // Enable looking up the timer item by the id of the event that started it.
        if (!state.timerItemsByStartEventId) {
            state.timerItemsByStartEventId = {};
        }
        state.timerItemsByStartEventId[event.eventId] = timerItem;
    },
    StartTimerFailed(event, state, items) {
        const attrs = event.startTimerFailedEventAttributes;
        const timerItem = {
            type: 'timer',
            canceled: false,
            cancelRequested: false,
            fired: false,
            inProgress: false,
            timerId: attrs.timerId,
            error: {
                code: attrs.cause,
                message: attrs.cause,
            },
            started: false,
        };
        items.push(timerItem);
    },
    TimerCanceled(event, state) {
        const attrs = event.timerCanceledEventAttributes;

        // Look up the item using the start event id.
        const timerItem = state.timerItemsByStartEventId[attrs.startedEventId];

        // Mark the thing as canceled.
        timerItem.canceled = timerItem.cancelRequested = true;
        timerItem.canceledAt = new Date(event.eventTimestamp);
        timerItem.inProgress = false;
    },
    TimerFired(event, state) {
        const attrs = event.timerFiredEventAttributes;
        const timerItem = state.timerItemsByStartEventId[attrs.startedEventId];

        // Mark the thing as fired
        timerItem.fired = true;
        timerItem.firedAt = new Date(event.eventTimestamp);
        timerItem.inProgress = false;
    },
};
