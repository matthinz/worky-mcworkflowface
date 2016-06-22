const { createDecisionFunctions } = require('../decisions');
const { distillEventsIntoItems } = require('../events');
const { summarizeWorkflowItems } = require('../util/logging');

/**
 * Normalizes a result returned from a decider into a set of decisions suitable
 * to pass into respondDecisionTaskCompleted().
 * @return {Array} An Array of objects describing Decisions.
 */
function normalizeDecisions(decisions) {
    // 1. If nothing returned from decider, treat as an empty array of decisions.
    if (!decisions) {
        return [];
    }

    // 2. Ensure we end up returning an array
    let normalizedDecisions;
    if (Array.isArray(decisions)) {
        normalizedDecisions = decisions;
    } else {
        normalizedDecisions = [decisions];
    }

    return normalizedDecisions;
}

/**
 * Executes the decider function for an incoming Decision task and returns an Array of decisions.
 */
function runDecider(task, deciderFunc, log, options) {
    const { events } = task;
    const items = distillEventsIntoItems(events);

    log(
        'Distilled %d event(s) into %d item(s): %s',
        events.length,
        items.length,
        summarizeWorkflowItems(items)
    );

    const availableDecisions = createDecisionFunctions(options);

    const decisions = deciderFunc(items, availableDecisions, {
        rawEvents: events,
    });
    return normalizeDecisions(decisions);
}

module.exports = { runDecider };
