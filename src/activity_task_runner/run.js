function runAndReturnPromise(func, ...args) {
    try {
        const result = func(...args);
        return (result instanceof Promise) ? result : Promise.resolve(result);
    } catch (err) {
        return Promise.reject(err);
    }
}

function normalizeInput(input) {
    // Input is provided as JSON, but we want to handle cases where there
    // *isn't* any input properly.
    if (input === undefined || input === '') {
        return undefined;
    }

    return JSON.parse(input);
}

function normalizeResult(result) {
    if (result === undefined || result === null) {
        return '';
    }

    return JSON.stringify(result);
}

/**
 * Invokes <func> in the context of the given activity task and returns its
 * result as a string.
 */
function runActivityTaskFunction(task, func) {
    return Promise.resolve().then(() => {
        const input = normalizeInput(task.input);
        const promise = runAndReturnPromise(func, input);

        return promise.then(normalizeResult);
    });
}

module.exports = {
    runActivityTaskFunction,
};
