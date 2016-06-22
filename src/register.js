const compareVersions = require('node-version-compare');

const log = require('debug')('swf');

const DEFAULT_ACTIVITY_TASK_SETTINGS = {
    defaultTaskStartToCloseTimeout: 'NONE',
    defaultTaskHeartbeatTimeout: 'NONE',
    defaultTaskScheduleToStartTimeout: 'NONE',
    defaultTaskScheduleToCloseTimeout: 'NONE',
};

/**
 * Ensures all activities + workflows are registered with SWF.
 * Returns a Promise that resolves when all registration is complete.
 */
function registerWithSwf({
    swfClient,
    domain,
    activityTaskDefinitions,
    workflowDefinitions,
}) {
    // Convert numeric values to strings for the benefit of the SWF API.
    function convertIntsToStrings(params) {
        const whitelist = [
            'defaultExecutionStartToCloseTimeout',
            'defaultTaskStartToCloseTimeout',
        ];
        whitelist.forEach((key) => {
            if (typeof params[key] === 'number') {
                params[key] = String(params[key]); // eslint-disable-line no-param-reassign
            }
        });
    }

    // General purpose registration function, handles the "already registered is not an error" case.
    function doRegistration({
        name,
        params,
        method,
        alreadyExistsErrorCode,
    }) {
        return new Promise((resolve, reject) => {
            log('%s %s', method, name);
            swfClient[method](params, (err) => {
                if (err) {
                    if (err.code === alreadyExistsErrorCode) {
                        log('%s: %s already registered', method, name);
                        resolve();
                        return;
                    }

                    reject(err);
                    return;
                }
                log('%s: %s registered', method, name);
                resolve();
            });
        });
    }

    function registerAllVersions({ name, versions = {} }, registrationFunc) {
        const versionNumbers = Object.keys(versions);
        versionNumbers.sort(compareVersions);

        const promises = versionNumbers
            .map((version) => ({
                name,
                version,
                settings: versions[version].settings,
            }))
            .map(registrationFunc);

        return Promise.all(promises);
    }

    function registerWorkflowVersion({ name, version, settings }) {
        const params = Object.assign(
            {},
            settings || {},
            {
                domain,
                name,
                version,
            }
        );

        convertIntsToStrings(params);

        return doRegistration({
            name: `${name}:${version}`,
            params,
            method: 'registerWorkflowType',
            alreadyExistsErrorCode: 'TypeAlreadyExistsFault',
        });
    }

    function registerWorkflowDefinitions() {
        const promises = workflowDefinitions.map((def) =>
            registerAllVersions(def, registerWorkflowVersion)
        );
        return Promise.all(promises);
    }

    function registerActivityTaskVersion({ name, version, settings }) {
        const params = Object.assign(
            {},
            settings || DEFAULT_ACTIVITY_TASK_SETTINGS,
            {
                domain,
                name,
                version,
            }
        );
        return doRegistration({
            name: `${name}:${version}`,
            params,
            method: 'registerActivityType',
            alreadyExistsErrorCode: 'TypeAlreadyExistsFault',
        });
    }

    function registerActivityTaskDefinitions() {
        return activityTaskDefinitions.map((def) =>
            registerAllVersions(def, registerActivityTaskVersion)
        );
    }

    return Promise.all([
        registerWorkflowDefinitions(),
        registerActivityTaskDefinitions(),
    ]).then(() => {
        log('Registration complete.');
    });
}

module.exports = {
    registerWithSwf,
};
