const { expect, assert } = require('chai');

const { createTaskPoller } = require('../../src/util/poller');

describe('poller', () => {
    const pagesToReturn = [
        {
            events: [
                { eventId: 1 },
                { eventId: 2 },
            ],
            taskToken: 'foo',
            nextPageToken: 'bar',
        },
        {
            events: [
                { eventId: 3 },
                { eventId: 4 },
            ],
            taskToken: 'foo',
            nextPageToken: 'foo',
        },
        {
            events: [
                { eventId: 5 },
                { eventId: 6 },
            ],
            taskToken: 'foo',
        },
    ];

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
        multiPageMethod(params, cb) {
            if (params.nextPageToken) {
                expect(pagesToReturn.length).to.be.greaterThan(0);
                process.nextTick(cb, null, pagesToReturn.shift());
                return;
            }


            // No nextPageToken, so return first page
            if (pagesToReturn.length > 0) {
                process.nextTick(cb, null, pagesToReturn.shift());
                return;
            }

            // No first page = no return.
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

    it('handles multiple pages of results', (done) => {
        const poller = createTaskPoller({
            swfClient: fakeClient,
            method: 'multiPageMethod',
            params: {},
        });
        let taskFired = false;

        poller.on('error', done);
        poller.on('timedOut', () => done(new Error("Timed out.")));
        poller.on('task', (task) => {
            assert(!taskFired, 'already recieved task');
            expect(task).to.deep.equal({
                events: [
                    { eventId: 1 },
                    { eventId: 2 },
                    { eventId: 3 },
                    { eventId: 4 },
                    { eventId: 5 },
                    { eventId: 6 },
                ],
                taskToken: 'foo',
            });
            taskFired = true;
            setTimeout(done, 300);
        });
        poller.start();
    });
});
