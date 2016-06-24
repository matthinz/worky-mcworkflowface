const JSONish = require('../../util/jsonish');

/* eslint-disable no-param-reassign */
module.exports = {
    WorkflowExecutionStarted(event, state, items) {
        const attrs = event.workflowExecutionStartedEventAttributes;
        const workflowItem = {
            type: 'workflow',
            started: true,
            startedAt: new Date(event.eventTimestamp),
            input: JSONish.parse(attrs.input),
        };
        state.workflowItem = workflowItem;
        items.push(workflowItem);
    },
    WorkflowExecutionCompleted(event, state) {
        const attrs = event.workflowExecutionCompletedEventAttributes;

        const { workflowItem } = state;
        workflowItem.result = attrs.result;
        workflowItem.finished = true;
        workflowItem.finishedAt = new Date(event.eventTimestamp);
    },
};
