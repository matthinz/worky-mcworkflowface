const itemHandlers = require('./types');
const logUnhandledEvent = require('debug')('swf:unhandled-events');

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
            if (logUnhandledEvent.enabled) {
                logUnhandledEvent(
                    'Unhandled SWF Event: %s',
                    JSON.stringify(event, null, 4)
                );
            }
        }
    });

    return items;
}

module.exports = {
    distillEventsIntoItems,
};

