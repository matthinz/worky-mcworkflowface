const { expect } = require('chai');
const lib = require('../../src');

describe('Public API', () => {
    [
        'init',
        'distillEventsIntoItems',
    ].forEach(func => {
        it(`exports ${func}`, () => {
            expect(lib).to.have.property(func);
            expect(lib.func).to.be.a.function;
        });
    });
});
