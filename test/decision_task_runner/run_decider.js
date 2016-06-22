const { expect } = require('chai');

const { runDecider } = require('../../src/decision_task_runner/run');

const NOOP = () => undefined;

describe('Decision Task Runner - Running the Decider', () => {
    it('calls decider', () => {
        const task = {
            events: [],
        };
        let deciderCalled = 0;
        function decider(items, availableDecisions) {
            deciderCalled++;
            expect(availableDecisions).to.exist;
        }
        const decisions = runDecider(task, decider, NOOP, {});
        expect(decisions).to.deep.equal([]);
        expect(deciderCalled).to.equal(1);
    });
    it('handles an actual decision', () => {
        const task = {
            events: [],
        };
        function decider(items, availableDecisions) {
            const { startTimer } = availableDecisions;
            return startTimer('testTimer', 30);
        }
        const decisions = runDecider(task, decider, NOOP, {});
        expect(decisions).to.deep.equal([
            {
                decisionType: 'StartTimer',
                startTimerDecisionAttributes: {
                    startToFireTimeout: '30',
                    timerId: 'testTimer',
                },
            },
        ]);
    });
});
