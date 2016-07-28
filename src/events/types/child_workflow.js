const JSONish = require('../../util/jsonish');
const NOOP = require('../../util/noop');

/* eslint-disable no-param-reassign */
module.exports = {
    StartChildWorkflowExecutionInitiated(event, state, items) {
        const attrs = event.startChildWorkflowExecutionInitiatedEventAttributes;
        const item = {
            type: 'child_workflow',
            name: attrs.workflowType.name,
            version: attrs.workflowType.version,
            workflowId: attrs.workflowId,
            canceled: false,
            cancelRequested: false,
            createdAt: new Date(event.eventTimestamp),
            error: false,
            inProgress: true,
            success: false,
        };
        items.push(item);

        // Stash the item by initiatedEventId for future reference.
        if (!state.childWorkflowItemsByEventId) {
            state.childWorkflowItemsByEventId = {};
        }
        state.childWorkflowItemsByEventId[event.eventId] = item;

        // Stash the item by workflowId for ExternalWorkflowExecutionCancelRequested (below)
        if (!state.childWorkflowItemsByWorkflowId) {
            state.childWorkflowItemsByWorkflowId = {};
        }
        state.childWorkflowItemsByWorkflowId[attrs.workflowId] = item;
    },
    ChildWorkflowExecutionStarted() {
        // This is currently a no-op. Item creation is handled above.
    },
    ChildWorkflowExecutionCompleted(event, state) {
        const attrs = event.childWorkflowExecutionCompletedEventAttributes;
        const item = state.childWorkflowItemsByEventId[attrs.initiatedEventId];
        item.inProgress = false;
        item.result = JSONish.parse(attrs.result);
        item.success = true;

        delete state.childWorkflowItemsByEventId[attrs.initiatedEventId];
        delete state.childWorkflowItemsByWorkflowId[item.workflowId];
    },
    ChildWorkflowExecutionFailed(event, state) {
        const attrs = event.childWorkflowExecutionFailedEventAttributes;
        const item = state.childWorkflowItemsByEventId[attrs.initiatedEventId];
        item.inProgress = false;
        item.success = false;
        item.error = {
            code: attrs.reason,
            message: attrs.details,
        };

        delete state.childWorkflowItemsByEventId[attrs.initiatedEventId];
        delete state.childWorkflowItemsByWorkflowId[item.workflowId];
    },
    RequestCancelExternalWorkflowExecutionInitiated: NOOP,
    ExternalWorkflowExecutionCancelRequested(event, state) {
        const attrs = event.externalWorkflowExecutionCancelRequestedEventAttributes;

        const itemsByWorkflowId = state.childWorkflowItemsByWorkflowId || {};
        const item = itemsByWorkflowId[attrs.workflowExecution.workflowId];

        if (item) {
            item.cancelRequested = true;
        }
    },
    RequestCancelExternalWorkflowExecutionFailed(event, state) {
        const attrs = event.requestCancelExternalWorkflowExecutionFailedEventAttributes;

        const itemsByWorkflowId = state.childWorkflowItemsByWorkflowId || {};
        const item = itemsByWorkflowId[attrs.workflowId];

        if (item) {
            item.cancelRequested = false;
        }
    },
    ChildWorkflowExecutionCanceled(event, state) {
        const attrs = event.childWorkflowExecutionCanceledEventAttributes;
        const item = state.childWorkflowItemsByEventId[attrs.initiatedEventId];

        item.canceled = true;
        item.inProgress = false;

        delete state.childWorkflowItemsByEventId[attrs.initiatedEventId];
        delete state.childWorkflowItemsByWorkflowId[item.workflowId];
    },
};
