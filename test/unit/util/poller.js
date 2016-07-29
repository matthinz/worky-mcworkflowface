const { expect, assert } = require('chai');
const { EventEmitter } = require('events');

const { createTaskPoller } = require('../../../src/util/poller');

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

    class MockAwsRequest extends EventEmitter {
        constructor(err, data, duration = 0) {
            super();
            this.err = err;
            this.data = data;
            this.duration = duration;
        }
        abort() {
            if (this.sendTimer) {
                clearTimeout(this.sendTimer);
                delete this.sendTimer;
            }

            const err = new Error('Request aborted by user');
            err.code = 'RequestAbortedError';

            this.emit('error', err, {});
            this.emit('complete');
        }
        send() {
            this.sendTimer = setTimeout(() => {
                if (this.err) {
                    // Simulate error
                    this.emit('error', this.err, {});
                    this.emit('complete', {});
                } else {
                    this.emit('success', { data: this.data }, {});
                    this.emit('complete', {});
                }
            }, this.duration);
        }
    }

    const fakeClient = {
        erroringPollMethod() {
            return new MockAwsRequest(new Error('Fake error.'));
        },
        succeedingPollMethod() {
            return new MockAwsRequest(null, {
                taskToken: 'foobarbaz',
            });
        },
        timingOutPollMethod() {
            return new MockAwsRequest(null, {
                // SWF docs state that taskToken will be '' if long polling times out
                taskToken: '',
            });
        },
        succeedingAfterAWhilePollMethod() {
            return new MockAwsRequest(null, {
                taskToken: 'foobarbaz',
            }, 500);
        },
        multiPageMethod(params) {
            if (params.nextPageToken) {
                expect(pagesToReturn.length).to.be.greaterThan(0);
                return new MockAwsRequest(null, pagesToReturn.shift());
            }

            // No nextPageToken, so return first page
            if (pagesToReturn.length > 0) {
                return new MockAwsRequest(null, pagesToReturn.shift());
            }

            throw new Error('No pages to return');
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
        poller.on('timedOut', () => done(new Error('Timed out.')));
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
    it('returns a Promise from stop()', () => {
        const poller = createTaskPoller({
            swfClient: fakeClient,
            method: 'succeedingAfterAWhilePollMethod',
            params: {},
        });

        const tasksReceived = [];
        let stopEvents = 0;

        poller.on('task', (task, continuePolling) => {
            tasksReceived.push(task);
            continuePolling();
        });

        poller.on('stopped', () => {
            stopEvents++;
        });

        poller.start();

        return poller.stop().then(() => {
            expect(poller.isRunning()).to.be.false;
            expect(tasksReceived).to.have.length(0);
            expect(stopEvents).to.equal(1);
        });
    });
    it('allows calling stop() repeatedly', () => {
        const poller = createTaskPoller({
            swfClient: fakeClient,
            method: 'succeedingAfterAWhilePollMethod',
            params: {},
        });

        poller.on('task', (task, continuePolling) => {
            continuePolling();
        });

        const promise = poller.stop();
        const nextPromise = poller.stop();
        expect(promise).to.equal(nextPromise);

        return promise.then(() => {
            const promiseAfterResolve = poller.stop();
            expect(promiseAfterResolve).to.equal(promise);
        });
    });
});
