const { EventEmitter } = require('events');

function createTaskPoller({
    swfClient,
    method,
    params,
}) {
    const poller = new EventEmitter();
    let stopRequested = false;

    function doPoll() {
        if (stopRequested) {
            poller.emit('stopped');
            return;
        }
        poller.emit('started');
        swfClient[method](params, (err, task) => {
            if (err) {
                poller.emit('error', err);
                process.nextTick(doPoll);
                return;
            }

            if (!task.taskToken) {
                // A missing taskToken indicates that long polling timed out and
                // we need to start over.
                poller.emit('timedOut');
                process.nextTick(doPoll);
                return;
            }

            // TODO: If task.nextPageToken is set, it means we need to keep
            //       calling client.pollForDecisionTask() to obtain the full
            //       list of events.

            function continuePolling() {
                process.nextTick(doPoll);
            }

            poller.emit('task', task, continuePolling);
        });
    }

    function stop() {
        stopRequested = true;
    }

    poller.start = doPoll;
    poller.stop = stop;

    return poller;
}

module.exports = {
    createTaskPoller,
};
