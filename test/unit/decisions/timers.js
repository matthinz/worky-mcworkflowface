const { expect } = require('chai');

const { createDecisionFunctions } = require('../../../src/decisions');

describe('timer decision helpers', () => {
    const { cancelTimer, startTimer } = createDecisionFunctions({});
    it('starts timer', () => {
        const decision = startTimer('foobar', 60);
        expect(decision).to.have.property('decisionType', 'StartTimer');
        expect(decision).to.have.property('startTimerDecisionAttributes');
        const attrs = decision.startTimerDecisionAttributes;
        expect(attrs).to.have.property('timerId', 'foobar');
        expect(attrs).to.have.property('startToFireTimeout', '60');
    });
    it('cancels timer', () => {
        const decision = cancelTimer('foobar');
        expect(decision).to.deep.equal({
            decisionType: 'CancelTimer',
            cancelTimerDecisionAttributes: {
                timerId: 'foobar',
            },
        });
    });
});
