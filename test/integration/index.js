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

    before('Register workflows + activities and start pollers', () => {
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

    after('Clean up', () => Promise.all([
        decisionTaskPoller.stop(),
        activityTaskPoller.stop(),
    ]));

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

    function runWorkflow(workflowId, workflowType, input = '', timeout = 10) {
        return new Promise((resolve, reject) => {
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

            swfClient.startWorkflowExecution(params, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                const { runId } = data;
                waitForExecutionClose(workflowId, runId).then(resolve, reject);
            });
        });
    }

    function getWorkflowResult(workflowId, runId) {
        return new Promise((resolve, reject) => {
            const params = {
                domain,
                execution: {
                    workflowId,
                    runId,
                },
                reverseOrder: true,
            };
            swfClient.getWorkflowExecutionHistory(params, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                const event = data.events.find(ev => ev.eventType === 'WorkflowExecutionCompleted');
                const { result } = event.workflowExecutionCompletedEventAttributes;
                resolve(JSON.parse(result));
            });
        });
    }

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
