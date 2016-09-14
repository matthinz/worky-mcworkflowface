const NOOP = require('../../util/noop');

// Undoes unhandled event tracking initiated by the distiller.
// The idea here is that a decision task completing or timing out
// marks an unhandled event as "handled".
function clearUnhandledEvents(event, state) {
    // eslint-disable-next-line no-param-reassign
    state.unhandledEvents = [];
}

module.exports = {
    DecisionTaskCompleted: clearUnhandledEvents,
    DecisionTaskTimedOut: clearUnhandledEvents,
    DecisionTaskScheduled: NOOP,
    DecisionTaskStarted: NOOP,
};
