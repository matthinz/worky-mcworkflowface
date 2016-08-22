const itemHandlers = require('./types');
const debug = require('debug');

const unhandledEventsSeenAt = {};
const UNHANDLED_EVENT_REPORTING_INTERVAL = 60 * 1000 * 3;

function logUnhandledEvent(event) {
    const lastSeenAt = unhandledEventsSeenAt[event.eventType] || 0;

    const now = Date.now();
    const msSinceLastLog = now - lastSeenAt;

    if (msSinceLastLog < UNHANDLED_EVENT_REPORTING_INTERVAL) {
        // We've already logged about this recently.
        return false;
    }

    unhandledEventsSeenAt[event.eventType] = now;

    const log = debug('swf:unhandled-events');
    if (!log.enabled) {
        return false;
    }

    log(
        'Unhandled SWF Event: %s',
        JSON.stringify(event, null, 4)
    );
    return true;
}

/**
 * Given a set of events reported by SWF, distill them into an easier to consume form.
 * @param  {Array} rawEvents
 * @return {Array} Array of Workflow Items.
 */
function distillEventsIntoItems(rawEvents) {
    const state = {};
    const items = [];

    rawEvents.forEach((event) => {
        let handled = false;
        itemHandlers.forEach((i) => {
            const func = i[event.eventType];
            if (typeof func === 'function') {
                func(event, state, items);
                handled = true;
            }
        });

        if (!handled) {
            logUnhandledEvent(event);
        }
    });

    return items;
}

module.exports = {
    distillEventsIntoItems,
};

