const JSONish = require('../../util/jsonish');

/* eslint-disable no-param-reassign */
module.exports = {
    WorkflowExecutionStarted(event, state, items) {
        const attrs = event.workflowExecutionStartedEventAttributes;
        const workflowItem = {
            type: 'workflow',
            canceled: false,
            cancelRequested: false,
            error: false,
            started: true,
            startedAt: new Date(event.eventTimestamp),
            input: JSONish.parse(attrs.input),
        };
        state.workflowItem = workflowItem;
        items.push(workflowItem);
    },
    WorkflowExecutionCancelRequested(event, state) {
        const { workflowItem } = state;
        workflowItem.cancelRequested = true;
    },
    WorkflowExecutionCompleted(event, state) {
        const attrs = event.workflowExecutionCompletedEventAttributes;

        const { workflowItem } = state;
        workflowItem.result = JSONish.parse(attrs.result);
        workflowItem.finishedAt = new Date(event.eventTimestamp);
    },
};
