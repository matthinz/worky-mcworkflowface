const nullFormatter = (i) => i;

const decisionFormatters = {
    RequestCancelActivityTask(d) {
        const { activityId } = d.requestCancelActivityTaskDecisionAttributes;
        return `${d.decisionType}(${activityId})`;
    },
    ScheduleActivityTask(d) {
        const { activityType } = d.scheduleActivityTaskDecisionAttributes;
        return `${d.decisionType}(${activityType.name})`;
    },
};

function summarizeList(things, formatter = nullFormatter, {
    fromStart = 2,
    fromEnd = 2,
    separator = ', ',
    yadaYada = '...',
} = {}) {
    const startItems = things.slice(0, fromStart);
    const numberOfEndItems = Math.min(fromEnd, things.length - fromStart);
    const endItems = numberOfEndItems > 0 ? things.slice(-numberOfEndItems) : [];

    const result = [...startItems.map(formatter)];

    if (endItems.length > 0) {
        if (startItems.length + endItems.length < things.length) {
            result.push(yadaYada);
        }
        result.push(...endItems.map(formatter));
    }

    return result.join(separator);
}

function formatDecision(decision) {
    if (decisionFormatters[decision.decisionType]) {
        return decisionFormatters[decision.decisionType](decision);
    }
    return decision.decisionType;
}

function summarizeDecisions(decisions) {
    return summarizeList(decisions, formatDecision);
}

function summarizeWorkflowItems(items) {
    return summarizeList(
        items,
        (i) => i.type
    );
}

module.exports = {
    summarizeList,
    summarizeDecisions,
    summarizeWorkflowItems,
};
