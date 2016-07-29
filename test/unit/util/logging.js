const { expect } = require('chai');

const { summarizeList } = require('../../../src/util/logging');

describe('logging', () => {
    describe('summarizeList()', () => {
        it('handles empty', () => {
            expect(summarizeList([])).to.equal('');
        });
        it('handles 2', () => {
            expect(summarizeList(['a', 'b'])).to.equal('a, b');
        });
        it('handles 3', () => {
            expect(summarizeList(['a', 'b', 'c'])).to.equal('a, b, c');
        });
        it('handles 4', () => {
            expect(summarizeList(['a', 'b', 'c', 'd'])).to.equal('a, b, c, d');
        });
        it('handles 5', () => {
            expect(summarizeList(['a', 'b', 'c', 'd', 'e'])).to.equal('a, b, ..., d, e');
        });
        it('handles 5', () => {
            expect(summarizeList(['a', 'b', 'c', 'd', 'e', 'f'])).to.equal('a, b, ..., e, f');
        });
    });
});
