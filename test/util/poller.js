const { expect, assert } = require('chai');

const { createTaskPoller } = require('../../src/util/poller');

describe('poller', () => {
    const fakeClient = {
        erroringPollMethod(params, cb) {
            process.nextTick(() => {
                cb(new Error('Fake error.'));
            });
        },
        succeedingPollMethod(params, cb) {
            cb(null, {
                taskToken: 'foobarbaz',
            });
        },
        timingOutPollMethod(params, cb) {
            process.nextTick(() => {
                cb(null, {
                    // SWF docs state that taskToken will be '' if long polling times out
                    taskToken: '',
                });
            });
        },
    };

    it('handles success', (done) => {
        const poller = createTaskPoller({
            swfClient: fakeClient,
            method: 'succeedingPollMethod',
            params: {},
        });

        poller.on('error', done);

        poller.on('task', (task) => {
            expect(task).to.deep.equal({
                taskToken: 'foobarbaz',
            });
            poller.stop();
            done();
        });

        poller.start();
    });

    it('handles errors', (done) => {
        const poller = createTaskPoller({
            swfClient: fakeClient,
            method: 'erroringPollMethod',
            params: {},
        });

        poller.on('error', (err) => {
            expect(err).to.have.property('message', 'Fake error.');
            poller.stop();
            done();
        });

        poller.on('task', () => {
            assert(false, 'should not receive a task');
        });

        poller.start();
    });

    it('handles timing out', (done) => {
        const poller = createTaskPoller({
            swfClient: fakeClient,
            method: 'timingOutPollMethod',
            params: {},
        });

        poller.on('error', done);
        poller.on('task', () => {
            assert(false, 'should not recieve a task');
        });
        poller.on('timedOut', () => {
            poller.stop();
            done();
        });

        poller.start();
    });
});
