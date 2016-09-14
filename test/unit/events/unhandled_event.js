const { assert, expect } = require('chai');

const { distillEventsIntoItems } = require('./helpers');

describe('Unhandled event', () => {
    [
        'DecisionTaskCompleted',
        'DecisionTaskTimedOut',
    ].forEach(eventType => {
        it(`throws when coming after ${eventType}`, () => {
            const events = [
                {
                    eventType,
                },
                {
                    eventType: 'SomeWeirdEventNoOneHasHeardOf',
                },
            ];
            try {
                distillEventsIntoItems(events);
                assert(false, 'should have thrown');
            } catch (err) {
                if (err.code !== 'EUNHANDLEDEVENT') {
                    throw err;
                }
            }
        });

        it(`does not throw when coming before ${eventType}`, () => {
            const events = [
                {
                    eventType: 'SomeWeirdEventNoOneHasHeardOf',
                },
                {
                    eventType,
                },
            ];
            const items = distillEventsIntoItems(events);
            expect(items).to.deep.equal([]);
        });
    });
});
