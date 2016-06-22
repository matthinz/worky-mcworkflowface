const { resolveNameAndVersion } = require('../util/version_resolution');
/**
 * Resolves the decider implementation to use for the given decision task.
 */
function resolveDeciderFunction(task, workflowDefinitions) {
    return Promise.resolve().then(() => {
        const { workflowType } = task;
        const definition = resolveNameAndVersion(workflowType, workflowDefinitions);

        if (!definition) {
            const { name, version } = workflowType;
            const err = new Error(`No workflow definition found for '${name}' ver. '${version}'.`);
            err.code = 'ENOWORKFLOWDEF';
            throw err;
        }

        const { decider } = definition;
        if (typeof decider !== 'function') {
            const { name, version } = workflowType;
            const err = new Error(`Invalid decider specified for '${name}', ver. '${version}'.`);
            err.code = 'EINVALIDDECIDER';
            throw err;
        }

        return decider;
    });
}

module.exports = { resolveDeciderFunction };
