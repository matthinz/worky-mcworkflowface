const { expect, assert } = require('chai');

const AWS = require('aws-sdk');

const workflowDefinitions = require('./workflows');
const activityTaskDefinitions = require('./activities');

const { init } = require('../../src');

describe('Integration Tests', () => {
    const swfClient = new AWS.SWF();

    const domain = process.env.SWF_DOMAIN;
    assert(domain, 'SWF_DOMAIN env is not set.');

    const taskList = `integration-tests-${Date.now()}`;
    let decisionTaskPoller;
    let activityTaskPoller;

    before('Register workflows + activities and start pollers', function () {
        this.timeout(5000);

        const SWF = init({
            swfClient,
            domain: process.env.SWF_DOMAIN,
            taskList,
            workflowDefinitions,
            activityTaskDefinitions,
        });

        return SWF.register().then(() => {
            decisionTaskPoller = SWF.startDecisionTaskPoller();
            activityTaskPoller = SWF.startActivityTaskPoller();
        });
    });

    after('Clean up', function () {
        this.timeout(5000);
        return Promise.all([
            decisionTaskPoller.stop(),
            activityTaskPoller.stop(),
        ]);
    });

    function waitForExecutionClose(workflowId, runId) {
        return new Promise((resolve, reject) => {
            function poll() {
                const params = {
                    domain,
                    execution: {
                        workflowId,
                        runId,
                    },
                };
                swfClient.describeWorkflowExecution(params, (err, data) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (data.executionInfo.executionStatus === 'CLOSED') {
                        resolve(data);
                        return;
                    }

                    setTimeout(poll, 1000);
                });
            }

            poll();
        });
    }

    function startWorkflow(workflowId, workflowType, input, timeout) {
        const params = {
            domain,
            workflowId,
            workflowType,
            taskList: {
                name: taskList,
            },
            executionStartToCloseTimeout: String(timeout),
            taskStartToCloseTimeout: 'NONE',
            childPolicy: 'TERMINATE',
            input,
        };

        return new Promise((resolve, reject) => {
            swfClient.startWorkflowExecution(params, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                const { runId } = data;
                resolve(runId);
            });
        });
    }

    function runWorkflow(workflowId, workflowType, input = '', timeout = 10) {
        return (
            startWorkflow(workflowId, workflowType, input, timeout)
                .then(runId => waitForExecutionClose(workflowId, runId))
        );
    }

    function getWorkflowEvents(workflowId, runId) {
        const params = {
            domain,
            execution: {
                workflowId,
                runId,
            },
            reverseOrder: true,
        };
        return new Promise((resolve, reject) => {
            swfClient.getWorkflowExecutionHistory(params, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data.events);
            });
        });
    }

    function getWorkflowResult(workflowId, runId) {
        return getWorkflowEvents(workflowId, runId).then(events => {
            const event = events.find(ev => ev.eventType === 'WorkflowExecutionCompleted');
            const { result } = event.workflowExecutionCompletedEventAttributes;
            return JSON.parse(result);
        });
    }

    it('FailToContinueAsNew', function (done) {
        const timeout = 15;
        this.timeout(timeout * 1000);

        const workflowId = `FailToContinueAsNew-${Date.now()}`;
        const workflowType = {
            name: 'FailToContinueAsNew',
            version: '1.0',
        };

        const startTime = Date.now();

        function checkOnWorkflow(runId) {
            getWorkflowEvents(workflowId, runId).then(events => {
                // eslint-disable-next-line max-len
                const event = events.find(e => e.eventType === 'ContinueAsNewWorkflowExecutionFailed');
                assert(event, 'History contains ContinueAsNewWorkflowExecutionFailed event');
                done();
            }).catch(done);
        }

        startWorkflow(workflowId, workflowType, '', timeout)
            .then(runId => {
                // Wait until 5s before our window runs out
                const wait =
                    (timeout * 1000)
                    -
                    (Date.now() - startTime)
                    - 5000;

                console.log('WAITING', wait / 1000);

                setTimeout(
                    () => checkOnWorkflow(runId),
                    wait
                );
            })
            .catch(done);
    });

    it('ReturnInput', function () {
        this.timeout(10000);

        const workflowId = `ReturnInput-${Date.now()}`;
        const workflowType = {
            name: 'ReturnInput',
            version: '1.0',
        };


        return runWorkflow(workflowId, workflowType).then(data => {
            expect(data.executionInfo).to.have.property('closeStatus', 'COMPLETED');
        });
    });

    it('ParentWithFailFirstTime', function () {
        this.timeout(10000);

        const workflowId = `ParentWithFailFirstTime-${Date.now()}`;
        const workflowType = {
            name: 'ParentWithFailFirstTime',
            version: '1.0',
        };

        return runWorkflow(workflowId, workflowType).then(data => {
            expect(data.executionInfo).to.have.property('closeStatus', 'COMPLETED');
        });
    });

    it('RunOneSuccessfulActivity', function () {
        this.timeout(10000);

        const workflowId = `RunOneSuccessfulActivity-${Date.now()}`;
        const workflowType = {
            name: 'RunOneSuccessfulActivity',
            version: '1.0',
        };

        const input = {
            now: Date.now(),
        };

        return runWorkflow(workflowId, workflowType, JSON.stringify(input)).then(data => {
            expect(data.executionInfo).to.have.property('closeStatus', 'COMPLETED');

            const { runId } = data.executionInfo.execution;
            return getWorkflowResult(workflowId, runId);
        }).then(result => {
            expect(result).to.deep.equal({
                pong: input,
            });
        });
    });
});
