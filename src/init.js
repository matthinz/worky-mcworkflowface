const os = require('os');

const { registerWithSwf } = require('./register');
const { pollForAndRunDecisionTasks } = require('./decision_task_runner');
const { pollForAndRunActivityTasks } = require('./activity_task_runner');
const { normalizeNameAndVersion } = require('./util/name_and_version');
const { resolveNameAndVersion } = require('./util/version_resolution');

function init(options) {
    const effectiveOptions = Object.assign(
        {
            activityTaskDefitions: [],
            identity: os.hostname(),
            workflowDefinitions: [],
        },
        options || {}
    );

    if (typeof options.swfClient !== 'object') {
        throw new Error('swfClient option is required.');
    }

    function register() {
        return registerWithSwf(effectiveOptions);
    }

    function resolveActivityTaskDefinition(name, version) {
        return resolveNameAndVersion(
            normalizeNameAndVersion(name, version),
            options.activityTaskDefitions
        );
    }

    function resolveWorkflowDefinition(name, version) {
        return resolveNameAndVersion(
            normalizeNameAndVersion(name, version),
            options.workflowDefinitions
        );
    }

    function startActivityTaskPoller() {
        return pollForAndRunActivityTasks(effectiveOptions);
    }

    function startDecisionTaskPoller() {
        return pollForAndRunDecisionTasks(effectiveOptions);
    }

    return {
        register,
        resolveActivityTaskDefinition,
        resolveWorkflowDefinition,
        startActivityTaskPoller,
        startDecisionTaskPoller,
    };
}

module.exports = { init };
