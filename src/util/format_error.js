/**
 * Given a JS error, returns an object with `reason` and `details` fields.
 * @param  {Error} err
 * @return {Object}
 */
function formatErrorForSwf(err) {
    let reason;
    let details;

    if (err && err.code) {
        reason = String(err.code);
    } else if (err && err.constructor && err.constructor.name) {
        reason = String(err.constructor.name);
    }

    if (err && err.message) {
        details = String(err.message);
    }

    const result = {};

    if (reason !== undefined) {
        result.reason = reason;
    }

    if (details !== undefined) {
        result.details = details;
    }

    return result;
}

module.exports = {
    formatErrorForSwf,
};
