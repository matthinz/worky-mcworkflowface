/* eslint-disable global-require */

const modules = [
    require('./activities'),
    require('./timers'),
    require('./workflow'),
];

function createDecisionFunctions(options) {
    const functions = {};

    modules.forEach(factoryOrFunctions => {
        let moduleFunctions;

        if (typeof factoryOrFunctions === 'function') {
            // This is a function that generates custom decision functions configured
            // for this specific run.
            moduleFunctions = factoryOrFunctions(options);
        } else {
            // This is an object with standard decision functions used independent of options.
            moduleFunctions = factoryOrFunctions;
        }

        Object.assign(functions, moduleFunctions);
    });

    return functions;
}

module.exports = {
    createDecisionFunctions,
};
