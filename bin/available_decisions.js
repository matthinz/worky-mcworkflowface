const { createDecisionFunctions } = require('../src/decisions');
const availableDecisions = createDecisionFunctions({});

function getArguments(func) {
    const m = /function\s*[\w]+\s*\((.+)\)/.exec(func.toString());
    return (
        m ?
            m[1].split(/,\s*/) :
            []
    );
}

Object.keys(availableDecisions)
    .map(name => {
        const func = availableDecisions[name];
        const args = getArguments(func);
        return `${name}(${args.join(', ')})`;
    })
    .sort()
    .forEach(line => console.log(line)); // eslint-disable-line no-console
