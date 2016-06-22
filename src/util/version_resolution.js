const compareVersions = require('node-version-compare');

function pickMaxVersion(versionsObj) {
    const versionNumbers = Object.keys(versionsObj || {});
    versionNumbers.sort(compareVersions);
    return versionNumbers[versionNumbers.length - 1];
}


function getLatestVersionForDefinitionNamed(name, definitions) {
    const def = definitions.find((d) => d.name === name);
    if (!def) {
        return undefined;
    }
    return pickMaxVersion(def.versions);
}

/**
 * Given an array of definitions that look like this:
 *     {
 *         "name": "FooBarBaz",
 *         "versions": {
 *             "1.0": { ... },
 *             "1.1": { ... }
 *         }
 *     }
 * Into an object that looks like this:
 *
 *      {
 *          "name": "FooBarBaz",
 *          "version: "1.0",
 *          // ...all key/value pairs from the 1.0 version blob
 *      }
 *
 * This is used for Activity Task Definitions and Workflow Definitions.
 */
function resolveNameAndVersion({ name, version }, definitions) {
    const def = definitions.find((d) => d.name === name);
    if (!def) {
        // Nothing found by name.
        return undefined;
    }

    let desiredVersion = version;

    if (!desiredVersion) {
        // If no version number specified, default to the latest version.
        desiredVersion = pickMaxVersion(def.versions);
    }

    if (!def.versions[desiredVersion]) {
        // Requested version does not exist.
        return undefined;
    }

    // Now, assemble a view of *just* this version
    return Object.assign(
        {
            name: def.name,
            version: desiredVersion,
        },
        def.versions[desiredVersion]
    );
}

module.exports = {
    getLatestVersionForDefinitionNamed,
    resolveNameAndVersion,
};
