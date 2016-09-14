const NOOP = require('../../util/noop');

// Undoes unhandled event tracking initiated by the distiller.
// The idea here is that a decision task completing or timing out
// marks an unhandled event as "handled".
function clearUnhandledEvents(event, state) {
    // eslint-disable-next-line no-param-reassign
    state.unhandledEvents = [];
}

// Currently we ignore decision task events.
// If a case can be made for why the decider needs to know that it has been called, we can add.
module.exports = {
    DecisionTaskCompleted: clearUnhandledEvents,
    DecisionTaskScheduled: NOOP,
    DecisionTaskStarted: NOOP,
    DecisionTaskTimedOut: clearUnhandledEvents,
};
