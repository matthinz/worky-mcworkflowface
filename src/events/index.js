const itemHandlers = require('./types');

/**
 * Given a set of events reported by SWF, distill them into an easier to consume form.
 * @param  {Array} rawEvents
 * @return {Array} Array of Workflow Items.
 */
function distillEventsIntoItems(rawEvents) {
    const state = {};
    const items = [];

    rawEvents.forEach((event) => {
        itemHandlers.forEach((i) => {
            const func = i[event.eventType];
            if (typeof func === 'function') {
                func(event, state, items);
            }
        });
    });

    return items;
}

module.exports = {
    distillEventsIntoItems,
};

