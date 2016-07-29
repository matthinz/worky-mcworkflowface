const { expect } = require('chai');

const JSONish = require('../../../src/util/jsonish');

describe('JSONish', () => {
    describe('parse', () => {
        const tests = [
            ['', undefined],
            [undefined, undefined],
            ['null', null],
            ['""', ''],
            ['{"foo":"bar"}', { foo: 'bar' }],
        ];
        tests.forEach(([input, expected]) =>
            it(`handles ${input}`, () =>
                expect(JSONish.parse(input)).to.deep.equal(expected)
            )
        );
    });
    describe('stringify', () => {
        const tests = [
            [undefined, ''],
            [null, 'null'],
            ['foo', '"foo"'],
            [{ foo: 'bar' }, '{"foo":"bar"}'],
        ];
        tests.forEach(([input, expected]) =>
            it(`handles ${input}`, () =>
                expect(JSONish.stringify(input)).to.deep.equal(expected)
            )
        );
    });
});
