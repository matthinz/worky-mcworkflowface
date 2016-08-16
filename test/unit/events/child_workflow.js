const { expect } = require('chai');

const {
    distillEventsIntoItems,
    distillSingleItem,
} = require('./helpers');

const initiatedEvent = {
    eventTimestamp: '2016-07-27T21:04:38.147Z',
    eventType: 'StartChildWorkflowExecutionInitiated',
    eventId: 5,
    startChildWorkflowExecutionInitiatedEventAttributes: {
        workflowId: 'TestChildWorkflow-1',
        workflowType: {
            name: 'TestChildWorkflow',
            version: '1.0',
        },
        executionStartToCloseTimeout: '86400',
        taskList: {
            name: 'worker',
        },
        decisionTaskCompletedEventId: 4,
        childPolicy: 'TERMINATE',
        taskStartToCloseTimeout: '10',
    },
};

const startedEvent = {
    eventTimestamp: '2016-07-27T21:04:38.245Z',
    eventType: 'ChildWorkflowExecutionStarted',
    eventId: 6,
    childWorkflowExecutionStartedEventAttributes: {
        workflowExecution: {
            workflowId: 'TestChildWorkflow-1',
            runId: '23uFacY94trcZ1jI+STBYTWAdHP9IrII/0eQHlUQqJxvo=',
        },
        workflowType: {
            name: 'TestChildWorkflow',
            version: '1.0',
        },
        initiatedEventId: 5,
    },
};

const startFailedEvent = {
    eventTimestamp: '2016-07-29T17:07:51.518Z',
    eventType: 'StartChildWorkflowExecutionFailed',
    eventId: 141,
    startChildWorkflowExecutionFailedEventAttributes: {
        workflowType: {
            name: 'TestChildWorkflow',
            version: '1.0',
        },
        cause: 'DEFAULT_EXECUTION_START_TO_CLOSE_TIMEOUT_UNDEFINED',
        workflowId: 'TestChildWorkflow-1',
        initiatedEventId: 0, // this is zero because there *is no initiated event*
        decisionTaskCompletedEventId: 140,
    },
};

const completedEvent = {
    eventTimestamp: '2016-07-27T21:41:08.863Z',
    eventType: 'ChildWorkflowExecutionCompleted',
    eventId: 14,
    childWorkflowExecutionCompletedEventAttributes: {
        workflowExecution: {
            workflowId: 'TestChildWorkflow-1',
            runId: '23uFacY94trcZ1jI+STBYTWAdHP9IrII/0eQHlUQqJxvo=',
        },
        workflowType: {
            name: 'TestChildWorkflow',
            version: '1.0',
        },
        result: '"COMPLETED!"',
        initiatedEventId: 5,
        startedEventId: 6,
    },
};

const failedEvent = {
    eventTimestamp: '2016-07-27T21:45:34.622Z',
    eventType: 'ChildWorkflowExecutionFailed',
    eventId: 14,
    childWorkflowExecutionFailedEventAttributes: {
        workflowExecution: {
            workflowId: 'TestChildWorkflow-1',
            runId: '23uFacY94trcZ1jI+STBYTWAdHP9IrII/0eQHlUQqJxvo=',
        },
        workflowType: {
            name: 'TestChildWorkflow',
            version: '1.0',
        },
        reason: 'EWHATEVER',
        details: 'ERROR!',
        initiatedEventId: 5,
        startedEventId: 6,
    },
};

const cancelRequestedEvent = {
    eventTimestamp: '2016-07-28T22:27:47.316Z',
    eventType: 'ExternalWorkflowExecutionCancelRequested',
    eventId: 19,
    externalWorkflowExecutionCancelRequestedEventAttributes: {
        workflowExecution: {
            workflowId: 'TestChildWorkflow-1',
            runId: '23B3zR1rMhybSI+koj+a1yc9ryj1yxeZJTaZIVkUu+NZM=',
        },
        initiatedEventId: 18,
    },
};

const cancelFailedEvent = {
    eventTimestamp: '2016-07-28T22:27:48.521Z',
    eventType: 'RequestCancelExternalWorkflowExecutionFailed',
    eventId: 31,
    requestCancelExternalWorkflowExecutionFailedEventAttributes: {
        workflowId: 'TestChildWorkflow-1',
        cause: 'UNKNOWN_EXTERNAL_WORKFLOW_EXECUTION',
        initiatedEventId: 30,
        decisionTaskCompletedEventId: 29,
    },
};

const canceledEvent = {
    eventTimestamp: '2016-07-28T23:20:56.050Z',
    eventType: 'ChildWorkflowExecutionCanceled',
    eventId: 18,
    childWorkflowExecutionCanceledEventAttributes: {
        workflowExecution: {
            workflowId: 'TestChildWorkflow-1',
            runId: '235cy113Zdn7FfOdq8izzOyCu2bYobpzhRgUfgNJ/dvfo=',
        },
        workflowType: {
            name: 'TestChildWorkflow',
            version: '1.0',
        },
        initiatedEventId: 5,
        startedEventId: 6,
    },
};

describe('Event Distillation - child_workflow', () => {
    it('StartChildWorkflowExecutionInitiated', () => {
        const item = distillSingleItem([
            initiatedEvent,
        ]);
        expect(item).to.deep.equal({
            type: 'child_workflow',
            name: 'TestChildWorkflow',
            version: '1.0',
            workflowId: 'TestChildWorkflow-1',
            canceled: false,
            cancelRequested: false,
            createdAt: '2016-07-27T21:04:38.147Z',
            error: false,
            inProgress: true,
            success: false,
        });
    });
    it('StartChildWorkflowExecutionFailed', () => {
        const item = distillSingleItem([
            startFailedEvent,
        ]);
        expect(item).to.deep.equal({
            type: 'child_workflow',
            name: 'TestChildWorkflow',
            version: '1.0',
            workflowId: 'TestChildWorkflow-1',
            canceled: false,
            cancelRequested: false,
            createdAt: '2016-07-29T17:07:51.518Z',
            error: {
                code: 'DEFAULT_EXECUTION_START_TO_CLOSE_TIMEOUT_UNDEFINED',
                message: 'DEFAULT_EXECUTION_START_TO_CLOSE_TIMEOUT_UNDEFINED',
            },
            inProgress: false,
            success: false,
        });
    });
    it('ChildWorkflowExecutionStarted', () => {
        const item = distillSingleItem([
            initiatedEvent,
            startedEvent,
        ]);
        expect(item).to.deep.equal({
            type: 'child_workflow',
            name: 'TestChildWorkflow',
            version: '1.0',
            workflowId: 'TestChildWorkflow-1',
            canceled: false,
            cancelRequested: false,
            createdAt: '2016-07-27T21:04:38.147Z',
            error: false,
            inProgress: true,
            success: false,
        });
    });
    it('ChildWorkflowExecutionCompleted', () => {
        const item = distillSingleItem([
            initiatedEvent,
            startedEvent,
            completedEvent,
        ]);
        expect(item).to.deep.equal({
            type: 'child_workflow',
            name: 'TestChildWorkflow',
            version: '1.0',
            workflowId: 'TestChildWorkflow-1',
            canceled: false,
            cancelRequested: false,
            createdAt: '2016-07-27T21:04:38.147Z',
            error: false,
            finishedAt: '2016-07-27T21:41:08.863Z',
            inProgress: false,
            success: true,
            result: 'COMPLETED!',
        });
    });
    it('ChildWorkflowExecutionFailed', () => {
        const item = distillSingleItem([
            initiatedEvent,
            startedEvent,
            failedEvent,
        ]);
        expect(item).to.deep.equal({
            type: 'child_workflow',
            name: 'TestChildWorkflow',
            version: '1.0',
            workflowId: 'TestChildWorkflow-1',
            canceled: false,
            cancelRequested: false,
            createdAt: '2016-07-27T21:04:38.147Z',
            error: {
                code: 'EWHATEVER',
                message: 'ERROR!',
            },
            finishedAt: '2016-07-27T21:45:34.622Z',
            inProgress: false,
            success: false,
        });
    });
    it('ExternalWorkflowExecutionCancelRequested - no started workflow', () => {
        const items = distillEventsIntoItems([cancelRequestedEvent]);
        expect(items).to.have.length(0);
    });
    it('ExternalWorkflowExecutionCancelRequested - previously started workflow', () => {
        const item = distillSingleItem([
            initiatedEvent,
            startedEvent,
            cancelRequestedEvent,
        ]);
        expect(item).to.deep.equal({
            type: 'child_workflow',
            name: 'TestChildWorkflow',
            version: '1.0',
            workflowId: 'TestChildWorkflow-1',
            canceled: false,
            cancelRequested: true,
            createdAt: '2016-07-27T21:04:38.147Z',
            error: false,
            inProgress: true,
            success: false,
        });
    });
    it('RequestCancelExternalWorkflowExecutionFailed - no started workflow', () => {
        const items = distillEventsIntoItems([cancelRequestedEvent, cancelFailedEvent]);
        expect(items).to.have.length(0);
    });
    it('RequestCancelExternalWorkflowExecutionFailed - previously started workflow', () => {
        const item = distillSingleItem([
            initiatedEvent,
            startedEvent,
            cancelRequestedEvent,
            cancelFailedEvent,
        ]);
        expect(item).to.deep.equal({
            type: 'child_workflow',
            name: 'TestChildWorkflow',
            version: '1.0',
            workflowId: 'TestChildWorkflow-1',
            canceled: false,
            cancelRequested: false,
            createdAt: '2016-07-27T21:04:38.147Z',
            error: false,
            inProgress: true,
            success: false,
        });
    });
    it('ChildWorkflowExecutionCanceled', () => {
        const item = distillSingleItem([
            initiatedEvent,
            startedEvent,
            cancelRequestedEvent,
            canceledEvent,
        ]);
        expect(item).to.deep.equal({
            type: 'child_workflow',
            name: 'TestChildWorkflow',
            version: '1.0',
            workflowId: 'TestChildWorkflow-1',
            canceled: true,
            cancelRequested: true,
            createdAt: '2016-07-27T21:04:38.147Z',
            error: false,
            finishedAt: '2016-07-28T23:20:56.050Z',
            inProgress: false,
            success: false,
        });
    });
});
