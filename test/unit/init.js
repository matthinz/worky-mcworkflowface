const { expect } = require('chai');
const { init } = require('../../src');

describe('init()', () => {
    it('requires swfClient', () => {
        expect(() => init({})).to.throw('swfClient option is required');
    });
});
