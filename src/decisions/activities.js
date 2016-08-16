const uuid = require('node-uuid');

const { normalizeNameAndVersion } = require('../util/name_and_version');
const {
    getLatestVersionForDefinitionNamed,
    resolveNameAndVersion,
} = require('../util/version_resolution');

function createActivityDecisionFunctions(options) {
    const { activityTaskDefinitions } = options;

    /**
     * Decision that starts an another activity running.
     */
    function startActivity(name, input) {
        const activityType = normalizeNameAndVersion(name);

        if (!activityType.version) {
            // Assume the latest version of this activity.
            activityType.version = getLatestVersionForDefinitionNamed(
                activityType.name,
                activityTaskDefinitions
            );
        }

        // Resolve the requested name+version combo.
        // We do this here because we can throw an easier-to-understand error than the AWS SDK.
        const resolved = resolveNameAndVersion(activityType, activityTaskDefinitions);

        if (!resolved) {
            const n = activityType.name;
            const v = activityType.version;
            const err = new Error(`Activity task does not exist: name='${n}', version='${v}'`);
            err.code = 'ENOACTIVITYDEF';
            throw err;
        }

        const attrs = {
            activityType,
            activityId: uuid.v4(),
            taskList: {
                name: options.taskList,
            },
        };

        if (input !== undefined && input !== null) {
            attrs.input = JSON.stringify(input);
        }

        return {
            decisionType: 'ScheduleActivityTask',
            scheduleActivityTaskDecisionAttributes: attrs,
        };
    }

    return {
        startActivity,
    };
}

module.exports = createActivityDecisionFunctions;
