const itemHandlers = require('./types');
const debug = require('debug');

function logUnhandledEvent(event) {
    const log = debug('swf:unhandled-events');

    if (!log.enabled) {
        return;
    }

    log(
        'Unhandled SWF Event: %s',
        JSON.stringify(event, null, 4)
    );
}

/**
 * Given a set of events reported by SWF, distill them into an easier to consume form.
 * @param  {Array} rawEvents
 * @return {Array} Array of Workflow Items.
 */
function distillEventsIntoItems(rawEvents) {
    const state = {
        unhandledEvents: [],
    };
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
            // Track unhandled events. DecisionTaskCompleted and
            // DecisionTaskTimedOut events will clear this flag, ensure that we
            // only crash once per decider run.
            state.unhandledEvents.push(event);
        }
    });

    const { unhandledEvents } = state;
    if (unhandledEvents.length) {
        // This is bad. Somehow, this amazing library is not built to handle
        // all the crazy events SWF can throw at us.
        // Most of the time, these will happen as a result of:
        //
        //   - Incorrect AWS permissions
        //   - AWS rate limiting
        //   - Decider bugs
        //
        // We handle this by throwing when the event is *first* encountered
        // (which will crash the decider and lead to DecisionTaskTimedOut
        // events). Subsequent decider runs will ignore the unhandled event.
        //
        // Hopefully, if workflow and decider timeouts are set up, this
        // will work as a defacto rate limiter.
        unhandledEvents.forEach(logUnhandledEvent);

        const eventTypes = unhandledEvents.map(event => event.eventType);
        const err = new Error(`Unhandled SWF event(s): ${eventTypes.join(', ')}`);
        err.code = 'EUNHANDLEDEVENT';
        throw err;
    }

    return items;
}

module.exports = {
    distillEventsIntoItems,
};

