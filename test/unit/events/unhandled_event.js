const { expect } = require('chai');

const { distillEventsIntoItems } = require('./helpers');

describe('Unhandled event', () => {
    it('does not die on unhandled event', () => {
        const items = distillEventsIntoItems([
            {
                eventType: 'SomeWeirdEventNoOneHasHeardOf',
            },
        ]);
        expect(items).to.deep.equal([]);
    });
    it('does not die on second unhandled event', () => {
        const items = distillEventsIntoItems([
            {
                eventType: 'SomeWeirdEventNoOneHasHeardOf',
            },
        ]);
        expect(items).to.deep.equal([]);
    });
});
