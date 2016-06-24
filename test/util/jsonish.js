const { expect } = require('chai');

const JSONish = require('../../src/util/jsonish');

describe('JSONish', () => {
    describe('parse', () => {
        const tests = [
            ['', undefined],
            ['""', ""],
        ];
        tests.forEach(([input, expected]) =>
            it(`handles ${input}`, () =>
                expect(JSONish.parse(input)).to.equal(expected)
            )
        );
    });
    describe('stringify', () => {
    });
})
