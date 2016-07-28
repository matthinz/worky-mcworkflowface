# worky-mcworkflowface

[![Build Status](https://travis-ci.org/matthinz/worky-mcworkflowface.svg?branch=master)](https://travis-ci.org/matthinz/worky-mcworkflowface)

_This is a work in progress and should not be used by anyone._

A Javascript library for working with AWS's Simple Workflow Service.

Before using this, you should review:

  - [The SWF Developer Guide](http://docs.aws.amazon.com/amazonswf/latest/developerguide/swf-welcome.html)
  - [The SWF Javascript SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SWF.html)

## Getting Started

  1. Register a SWF domain (if you need one needed).
  2. Write some [workflows](#workflow-definition) and [activity tasks](#activity-task-definition).
  3. Call `init()` with your configuration options.
  3. Register your activity tasks and workflows.
  4. Start decision and activity task pollers.

Or, in JS:

```javascript
const AWS = require('aws-sdk');
const { init } = require('worky-mcworkflowface');
const {
    on,
    register,
    startActivityTaskPoller,
    startDecisionTaskPoller,
} = init({
    swfClient: new AWS.SWF(),
    domain: 'MyDomain',
    taskList: 'MainTaskList',
    workflowDefinitions: require('./workflows'),
    activityTaskDefinitions: require('./activities'),
});

on('error', (err) => {
    console.error(err);
});

register().then(() => {
    startActivityTaskPoller();
    startDecisionTaskPoller();
});

```

## Public API

<a name="api-init"></a>
We expose a single public api method: `init(options)`.

Available options:

|           Option          |   Type   |                                         Description                                         |
|---------------------------|----------|---------------------------------------------------------------------------------------------|
| `swfClient`               |          | AWS SWF client instance to use (e.g. `new AWS.SWF()`).                                      |
| `activityTaskDefinitions` | `Array`  | Array of [Activity Task Definitions](#activity-task-definition) to use.                     |
| `workflowDefinitions`     | `Array`  | Array of [Workflow Definitions](#workflow-definition) to use.                               |
| `domain`                  | `String` | SWF domain we are running in.                                                               |
| `identity`                | `String` | _(Optional.)_ Identity of this worker passed to SWF. Defaults to `os.hostname()`.           |
| `taskList`                | `String` | Name of the task list we are using. Any decisions made requiring a task list will use this. |

`init(options)` then returns an object with the following methods:

|                     Method                     |                                                     Description                                                      |
|------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| `on()`                                         | A standard `EventEmitter.on()` method used to listen for events.                                                     |
| `register()`                                   | Registers your workflows and activity tasks with SWF. Returns a `Promise` that resolves when registration completes. |
| `resolveActivityTaskDefinition(name, version)` | Resolves a specific name + version combo of an activity task.                                                                                                                     |
| `resolveWorkflowDefinition(name, version)`     | Resolves a specific name + version combo of a decision task.                                                                                                                     |
| `startActivityTaskPoller()`                    | Starts polling for and executing SWF Activity Tasks.                                                                 |
| `startDecisionTaskPoller()`                    | Starts polling for and executing SWF Decision Tasks.                                                                 |

Any errors encountered during polling and execution will be emitted as `error` events. You can trap them like so:

```javascript
const { on } = init(options);
on('error', (err) => {
    console.error('oh noes!', err);
});
```

## Deciders

The core of each workflow is the **Decider** function. The decider is called repeatedly and receives a record of execution so far. Its job is to tell SWF the thing(s) to do next.

Here's an example:

```javascript
function myDeciderFunction(workflowItems, availableDecisions) {
    const { startTimer, completeWorkflow } = availableDecisions;

    let timerItem = { started: false };

    // Scan through the workflow and look for a timer
    workflowItems.forEach((item) => {
        if (item.type === 'timer' && item.timerId === 'testTimer') {
            timerItem = item;
        }
    });

    if (!timerItem.started || timerItem.error) {
        // We have not started our timer or there was an error starting it.
        // Attempt to start it.
        return startTimer('testTimer', 30);
    }

    if (timerItem.fired) {
        // Timer has fired! All done.
        return completeWorkflow();
    }
}
```

Things to note about Decider functions:

- They receive two arguments: [`items`](#workflow-items) and `availableDecisions`
- Can return one of the following:
    + A string, which is interpreted as an activity name (with current max version number)
    + An object describing a Decision
    + An array of either of the above

If your Decider throws an `Error` the associated decision task will be marked as failed and retried. Returning Promises from Deciders is not supported--your decider should execute synchronously, using Activity Tasks and Child Workflows for async processing.

### `availableDecisions`

The following decision functions are passed into the decider as the second arg:

```
cancelTimer(timerId)
cancelWorkflowExecution()
completeWorkflowExecution(result)
continueAsNewWorkflowExecution(input)
failWorkflowExecution(err)
requestCancelExternalWorkflowExecution(workflowId)
startActivity(name, input)
startChildWorkflowExecution(type, id, input)
startTimer(timerId, seconds)
```

TODO: More docs on the above.

<a name="workflow-items"></a>
## `WorkflowItems`

SWF sends down a complete record of all events with each Decision task. This record can be difficult to parse, so we pre-process it. We merge associated events into single `WorkflowItem` for ease of reference.

### Supported Item Types

|      `type`      |                                    Description                                     |
|------------------|------------------------------------------------------------------------------------|
| `activity`       | An attempt to execute an activity task.                                            |
| `child_workflow` | Another workflow execution started via a `startChildWorkflowExecution()` decision. |
| `signal`         | An external signal received by the workflow.                                       |
| `timer`          | An attempt to start a timer.                                                       |
| `workflow`       | The current workflow execution. This will *always* be the first item.              |

_TODO: Support other kinds of events._

#### Properties of `activity`, `workflow`, and `child_workflow` Items

|           Property           |   Type   |                                                          Description                                                           |
|------------------------------|----------|--------------------------------------------------------------------------------------------------------------------------------|
| `type`                       | `String` | `"activity"` or `"workflow"`.                                                                             |
| `name`                       | `String` | Name of the activity or workflow.                                                                                              |
| `version`                    | `String` | Version of the activity or workflow.                                                                                           |
| `activityId` or `workflowId` | `String` | ID assigned to this activity or workflow execution.                                                                            |
| `canceled`                   | `Bool`   | Whether this item's execution was canceled.                                                                                    |
| `cancelRequested`            | `Bool`   | Whether we've requested cancellation of this item's execution.                                                                 |
| `error`                      | `Object` | If execution failed, this will be an object with `code` and `message` fields describing why. Otherwise it will be `undefined`. |
| `inProgress`                 | `Bool`   | Whether execution of this item is currently happening (that is, it has not completed or been canceled).                        |
| `input`                      | `Mixed`  | Input to the activity or workflow.                                                                                             |
| `result`                     | `Mixed`  | If execution completed successfully, this will be the activity/workflow result.                                                |
| `started`                    | `Bool`   | Whether execution has started.                                                                                                 |
| `startedAt`                  | `Date`   | When execution started.                                                                                                        |
| `success`                    | `Bool`   | Whether execution completed successfully.                                                                                      |

#### Properties of `timer` Items

|      Property     |   Type   |                                      Description                                       |
|-------------------|----------|----------------------------------------------------------------------------------------|
| `type`            | `String` | `"timer"`.                                                                             |
| `timerId`         | `String` | Timer id. Pass to `cancelTimer()` decision.                                            |
| `canceled`        | `Bool`   | Whether this timer has been canceled.                                                  |
| `cancelRequested` | `Bool`   | Whether we have requested to cancel this timer.                                        |
| `error`           | `Object` | If there was an error starting this timer, it will be here.                            |
| `fired`           | `Bool`   | Whether this timer has fired (without being canceled).                                 |
| `firedAt`         | `Date`   | Timestamp when this timer fired. If the timer has not fired, this will be `undefined`. |
| `inProgress`      | `Bool`   | Whether this timer is currently running.                                               |
| `started`         | `Bool`   | Whether this timer has started ticking.                                                |
| `startedAt`       | `Date`   | When this timer started ticking. `undefined` if not started.                           |

#### Properties of `signal` Items

|   Property   |   Type   | Description |
|--------------|----------|-------------|
| `type`       | `String` | `"signal"`  |
| `signalName` | `String` |             |
| `input`      | `String` |             |

## Decisions

The `availableDecisions` argument passed to your decider provides a series of functions for creating the structures used to describe decisions. See [`src/decisions`](./src/decisions) for available functions.

## Logging

Logging is done via [`debug`](https://github.com/visionmedia/debug).

Namespaces are as follows:

- `swf:<workflowId>:decider` - For decision task polling + execution.
- `swf:<workflowId>:<ActivityTaskName>:<activityId>` - For activity task polling + execution.

### Representing Errors

Errors are represented in Workflow Items as objects with two fields: `code` and `message`. These fields map to the `reason` and `details` field used by the SWF API.

---

<a name="workflow-definition"></a>
## Workflow Definition

A Workflow Definition looks like this:

```javascript
{
    name: "MyWorkflow",
    versions: {
        "1.0": {
            decider: function myOldDecider() { },
            settings: {
                /* various settings for workflow creation */
                defaultChildPolicy: 'TERMINATE',
                defaultTaskStartToCloseTimeout: '600',
            }
        },
        "1.1": {
            decider: function myNewDecider() { },
            settings: {
                /* etc. */
            }
        }
    }
}
```

Things to note:

  - Each version of a workflow must provide its own `decider` function and `settings` object.
  - `settings` are passed into the AWS SDK's [`registerWorkflowType()`](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SWF.html#registerWorkflowType-property) method.
  - Calling the `register()` function returned by [`init()`](#api-init) will attempt to register each workflow version.

You provide your workflow definitions as an array via the `workflowDefinitions` option pass into `init()`.

<a name="activity-task-definition"></a>
## Activity Task Definition

An Activity Task Definition looks like this:

```javascript
{
    name: "MyActivity",
    versions: {
        "1.0": {
            func: function myActivityFunction(input)
            settings: {
                /* settings for activity registration */
            },
        },
    }
}
```

Activity Task Definitions look like Workflow Definitions

### Writing Activity Functions

An Activity function:

- Receives a single argument, `input`
  - `input` can be any JSON-encodable type.
- Can return a value or the `Promise` of a value.
  - Return values will be automatically passed through `JSON.stringify()`. Avoid returning values that cannot be serialized to JSON.
- Can throw `Error`s.

Returning a rejected `Promise` or throwing an `Error` will result in the Activity Task Execution failing.
Your decider will be passed the error details and can decide how to proceed.
