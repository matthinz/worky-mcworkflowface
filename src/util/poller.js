const { EventEmitter } = require('events');

function createTaskPoller({
    swfClient,
    method,
    params,
}) {
    const poller = new EventEmitter();
    let stopRequested = false;

    function doPoll() {
        poller.emit('started');

        let task = null;
        let nextPageToken = null;

        function fetchNextPage() {
            if (stopRequested) {
                poller.emit('stopped');
                return;
            }

            let actualParams = params;
            if (nextPageToken) {
                actualParams = Object.assign({}, params, { nextPageToken });
            }

            swfClient[method](actualParams, (err, taskPage) => {
                if (err) {
                    poller.emit('error', err);
                    process.nextTick(doPoll);
                    return;
                }

                if (!taskPage.taskToken) {
                    // A missing taskToken indicates that long polling timed out and
                    // we need to start over.
                    poller.emit('timedOut');
                    process.nextTick(doPoll);
                    return;
                }

                // Merge this page into the task we are building that we will eventually emit.
                if (task) {
                    task.events = [
                        ...task.events,
                        ...taskPage.events,
                    ];
                } else {
                    task = Object.assign({}, taskPage);
                }

                if (taskPage.nextPageToken) {
                    // There is another page to fetch to ensure we get all events.
                    nextPageToken = taskPage.nextPageToken;
                    process.nextTick(fetchNextPage);
                    return;
                }

                // We are ready to emit this task and start all over again.
                function continuePolling() {
                    process.nextTick(doPoll);
                }
                delete task.nextPageToken;

                poller.emit('task', task, continuePolling);
            });
        }

        fetchNextPage();
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
