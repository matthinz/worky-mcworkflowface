const { assert } = require('chai');

const AWS = require('aws-sdk');

const workflowDefinitions = require('./workflows');
const activityTaskDefinitions = require('./activities');

const { init } = require('../../src');

describe('Integration Tests', () => {
    const swfClient = new AWS.SWF();

    const domain = process.env.SWF_DOMAIN;
    assert(domain, 'SWF_DOMAIN env is not set.');

    const taskList = `integration-tests-${Date.now()}`;

    before('Register workflows + activities and start pollers', () => {
        const {
            register,
            startDecisionTaskPoller,
        } = init({
            swfClient,
            domain: process.env.SWF_DOMAIN,
            taskList,
            workflowDefinitions,
            activityTaskDefinitions,
        });

        return register().then(() => Promise.all([
            startDecisionTaskPoller(),
        ]));
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
                        resolve(data.executionInfo.closeStatus);
                        return;
                    }

                    setTimeout(poll, 1000);
                });
            }

            poll();
        });
    }

    function runWorkflow(workflowId, workflowType, timeout = 10) {
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

    it('ReturnInput', function () {
        this.timeout(10000);

        const workflowId = `ReturnInput-${Date.now()}`;
        const workflowType = {
            name: 'ReturnInput',
            version: '1.0',
        };


        return runWorkflow(workflowId, workflowType).then(closeStatus => {
            assert.equal(closeStatus, 'COMPLETED', 'Execution completed successfully');
        });
    });

    it('ParentWithFailFirstTime', function () {
        this.timeout(10000);

        const workflowId = `ParentWithFailFirstTime-${Date.now()}`;
        const workflowType = {
            name: 'ParentWithFailFirstTime',
            version: '1.0',
        };

        return runWorkflow(workflowId, workflowType).then(closeStatus => {
            assert.equal(closeStatus, 'COMPLETED', 'Execution completed successfully');
        });
    });
});
