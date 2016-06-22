/**
 * Accepts various types of input and normalizes into an object with `name` and `version` keys.
 */
function normalizeNameAndVersion(name, version) {
    const result = {};

    if (typeof name === 'object') {
        result.name = name.name;
        result.version = name.version;
    } else {
        result.name = name;
        result.version = version;
    }

    return result;
}

module.exports = {
    normalizeNameAndVersion,
};
