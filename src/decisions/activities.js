const uuid = require('node-uuid');

const { normalizeNameAndVersion } = require('../util/name_and_version');
const { getLatestVersionForDefinitionNamed } = require('../util/version_resolution');

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
