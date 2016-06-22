const { resolveNameAndVersion } = require('../util/version_resolution');

/**
 * Resolves the implementation function to use for an incoming activity task.
 */
function resolveActivityTaskFunction(task, activityTaskDefinitions) {
    return new Promise((resolve, reject) => {
        const { activityType } = task;
        const definition = resolveNameAndVersion(activityType, activityTaskDefinitions);

        if (!definition) {
            const { name, version } = activityType;
            const err = new Error(
                `No activity task definition found for '${name}', version '${version}'.`
            );
            err.code = 'ENOACTIVITYDEF';
            reject(err);
            return;
        }

        resolve(definition.func);
    });
}

module.exports = {
    resolveActivityTaskFunction,
};
