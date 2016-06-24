const JSONish = require('../util/jsonish');

function runAndReturnPromise(func, ...args) {
    try {
        const result = func(...args);
        return (result instanceof Promise) ? result : Promise.resolve(result);
    } catch (err) {
        return Promise.reject(err);
    }
}

/**
 * Invokes <func> in the context of the given activity task and returns its
 * result as a string.
 */
function runActivityTaskFunction(task, func) {
    return Promise.resolve().then(() => {
        const input = JSONish.parse(task.input);
        const promise = runAndReturnPromise(func, input);
        return promise.then(JSONish.stringify);
    });
}

module.exports = {
    runActivityTaskFunction,
};
