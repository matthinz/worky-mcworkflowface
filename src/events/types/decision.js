const NOOP = require('../../util/noop');

// Currently we ignore decision task events.
// If a case can be made for why the decider needs to know that it has been called, we can add.
module.exports = {
    DecisionTaskCompleted: NOOP,
    DecisionTaskScheduled: NOOP,
    DecisionTaskStarted: NOOP,
    DecisionTaskTimedOut: NOOP,
};
