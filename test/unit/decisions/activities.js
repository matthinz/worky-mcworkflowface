const { expect } = require('chai');

const { createDecisionFunctions } = require('../../../src/decisions');

describe('startActivity()', () => {
    const activityTaskDefinitions = [
        {
            name: 'MyActivityTask',
            versions: {
                '1.0': { },
                '2.0': { },
            },
        },
    ];

    const decisionFunctions = createDecisionFunctions({
        activityTaskDefinitions,
        taskList: 'MyTaskList',
    });

    const { startActivity } = decisionFunctions;

    it('accepts just activity name', () => {
        const decision = startActivity('MyActivityTask');
        expect(decision).to.have.property('decisionType', 'ScheduleActivityTask');

        const attrs = decision.scheduleActivityTaskDecisionAttributes;
        expect(attrs).to.have.property('activityType').deep.equal({
            name: 'MyActivityTask',
            version: '2.0',
        });
        expect(attrs).to.have.property('activityId').match(/.+/);
        expect(attrs).not.to.have.property('input');

        expect(attrs).to.have.property('taskList').deep.equal({
            name: 'MyTaskList',
        });
    });

    it('converts input to JSON', () => {
        const decision = startActivity('MyActivityTask', 'here is some input');
        const attrs = decision.scheduleActivityTaskDecisionAttributes;
        expect(attrs).to.have.property('input', '"here is some input"');
    });
});
