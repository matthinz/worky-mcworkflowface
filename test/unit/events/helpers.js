const { expect } = require('chai');

const { distillEventsIntoItems } = require('../../../src/events');

// deep.equal() does not handle Date instances very well, so this does an initial
// pass over an object, checking that various `*At` properties are `Date` instances
// and converting them to ISO strings for .deep.equal() checks.
function checkDateProperties(obj) {
    const dateProperties = [
        'createdAt',
        'canceledAt',
        'firedAt',
        'startedAt',
    ];
    dateProperties.forEach((prop) => {
        if (obj[prop] !== undefined) {
            expect(obj).to.have.property(prop).be.an.instanceOf(Date);
            obj[prop] = obj[prop].toISOString(); // eslint-disable-line no-param-reassign
        }
    });

    return obj;
}

function distillSingleItem(events) {
    const items = distillEventsIntoItems(events);
    expect(items).to.have.length(1);
    return checkDateProperties(items[0]);
}

module.exports = {
    checkDateProperties,
    distillEventsIntoItems,
    distillSingleItem,
};
