// JSON-ish parsing / stringification used for workflow and activity inputs and activity results.
// We serialize `undefined` as "", `null` as "null", and everything else as JSON.

function parse(input) {
    if (input === undefined || input === '') {
        return undefined;
    }

    if (input === 'null') {
        return null;
    }

    return JSON.parse(input);
}

function stringify(obj) {
    if (obj === undefined) {
        return '';
    }

    if (obj === null) {
        return 'null';
    }

    // TODO: Math.Infinity, etc.

    return JSON.stringify(obj);
}

module.exports = {
    stringify,
    parse,
};
