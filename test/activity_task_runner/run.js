const { expect } = require('chai');

const { runActivityTaskFunction } = require('../../src/activity_task_runner/run');

describe('Activity Task Runner', () => {
    it('runs tasks with JSON input', () => {
        const originalInput = {
            foo: 'bar',
        };
        const originalResult = {
            done: true,
        };
        const task = {
            input: JSON.stringify(originalInput),
        };
        function func(input) {
            expect(input).to.deep.equal(originalInput);
            return Promise.resolve().then(() => originalResult);
        }
        return runActivityTaskFunction(task, func).then(result => {
            expect(result).to.be.a.string;
            expect(JSON.parse(result)).to.deep.equal(originalResult);
        });
    });
    it('runs tasks with no input', () => {
        const task = {};
        function func(input) {
            expect(input).to.be.undefined;
        }
        return runActivityTaskFunction(task, func);
    });
    it('runs tasks with empty string as input', () => {
        const task = {
            input: '',
        };
        function func(input) {
            expect(input).to.be.undefined;
        }
        return runActivityTaskFunction(task, func);
    });
    it('handles tasks returning undefined', () => {
        const task = {};
        const func = () => undefined;
        return runActivityTaskFunction(task, func).then(result => {
            expect(result).to.equal('');
        });
    });
    it('handles tasks returning null', () => {
        const task = {};
        const func = () => null;
        return runActivityTaskFunction(task, func).then(result => {
            expect(result).to.equal('null');
        });
    });
    it('handles tasks returning empty strings', () => {
        const task = {};
        const func = () => '';
        return runActivityTaskFunction(task, func).then(result => {
            expect(result).to.equal('""');
        });
    });
});
