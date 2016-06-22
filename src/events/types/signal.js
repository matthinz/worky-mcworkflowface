module.exports = {
    WorkflowExecutionSignaled(event, state, items) {
        const attrs = event.workflowExecutionSignaledEventAttributes;
        const signalItem = {
            type: 'signal',
            createdAt: new Date(event.eventTimestamp),
            signalName: attrs.signalName,
            input: attrs.input,
        };
        items.push(signalItem);
    },
};
