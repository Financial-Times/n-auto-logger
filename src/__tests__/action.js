import logger from '../index';
import { autoLogAction, autoLogActions } from '../action';
import { RESULTS } from '../constants';

jest.mock('@financial-times/n-logger');

/*
	compatibility test with n-auto-metrics
	https://github.com/Financial-Times/n-auto-metrics/blob/master/src/__tests__/action.js
 */

describe('autoLogAction', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('logs callFunction name as action name', async () => {
		const callFunction = () => null;
		autoLogAction(callFunction)();
		expect(logger.info.mock.calls[1][0]).toEqual({
			action: 'callFunction',
			result: RESULTS.SUCCESS,
		});
	});

	it('returns an enhanced function with a configurable .name same as callFunction', async () => {
		const callFunction = () => null;
		const enhancedFunction = autoLogAction(callFunction);
		expect(enhancedFunction.name).toEqual(callFunction.name);
		Object.defineProperty(enhancedFunction, 'name', {
			value: 'test',
			configurable: true,
		});
		expect(enhancedFunction.name).toBe('test');
	});

	describe('async function', () => {
		it('should invoke callFunction correctly', async () => {
			const callFunction = jest.fn(() => Promise.resolve('foo'));
			const params = { test: 'a' };
			const meta = { meta: 'b' };
			const result = await autoLogAction(callFunction)(params, meta);
			expect(callFunction.mock.calls).toMatchSnapshot();
			const expectedResult = await callFunction(params, meta);
			expect(result).toBe(expectedResult);
		});

		it('should log callFunction success correctly', async () => {
			const callFunction = () => Promise.resolve('foo');
			const params = { test: 'a' };
			const meta = { meta: 'b' };
			await autoLogAction(callFunction)(params, meta);
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('should log callFunction failure correctly and throw the original exception', async () => {
			const errorInstance = { message: 'bar' };
			const callFunction = async () => {
				throw errorInstance;
			};
			const params = { test: 'a' };
			const meta = { meta: 'b' };
			try {
				await autoLogAction(callFunction)(params, meta);
			} catch (e) {
				expect(e).toBe(errorInstance);
				expect(logger.error.mock.calls).toMatchSnapshot();
			}
		});
	});

	describe('non-async function', () => {
		it('should invoke callFunction correctly', () => {
			const callFunction = jest.fn(() => 'foo');
			const params = { test: 'a' };
			const meta = { meta: 'b' };
			const result = autoLogAction(callFunction)(params, meta);
			expect(callFunction.mock.calls).toMatchSnapshot();
			const expectedResult = callFunction(params, meta);
			expect(result).toBe(expectedResult);
		});

		it('should log callFunction success correctly', () => {
			const callFunction = () => 'foo';
			const params = { test: 'a' };
			const meta = { meta: 'b' };
			autoLogAction(callFunction)(params, meta);
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('should log callFunction failure correctly and throw the original exception', () => {
			const errorInstance = { message: 'bar' };
			const callFunction = () => {
				throw errorInstance;
			};
			const params = { test: 'a' };
			const meta = { meta: 'b' };
			try {
				autoLogAction(callFunction)(params, meta);
			} catch (e) {
				expect(e).toBe(errorInstance);
				expect(logger.error.mock.calls).toHaveLength(1);
				expect(logger.error.mock.calls).toMatchSnapshot();
			}
		});
	});

	describe('args format', () => {
		it('should support lazy callFunction signature in one object or no meta', async () => {
			const callFunction = () => null;
			const enhanced = args => autoLogAction(callFunction)(args);
			const params = { a: 'foo' };
			const meta = { b: 'bar' };
			const args = { ...params, ...meta };
			await enhanced(args);
			expect(logger.info.mock.calls[1][0]).toEqual({
				...params,
				...meta,
				action: 'callFunction',
				result: RESULTS.SUCCESS,
			});
			await enhanced(params);
			expect(logger.info.mock.calls[3][0]).toEqual({
				...params,
				action: 'callFunction',
				result: RESULTS.SUCCESS,
			});
		});

		it("should throw error if there're more than 2 args", () => {
			const callFunction = () => null;
			const params = { a: 'test' };
			const meta = { b: 'k' };
			const random = 'test';
			const execution = () => autoLogAction(callFunction)(params, meta, random);
			expect(execution).toThrowErrorMatchingSnapshot();
		});

		it('should log error if input arg params is not an Object', () => {
			const callFunction = () => null;
			const params = 'test';
			const meta = { b: 'k' };
			const execution = () => autoLogAction(callFunction)(params, meta);
			expect(execution).toThrowErrorMatchingSnapshot();
		});

		it('should log error if input arg meta is specified but not an Object', () => {
			const callFunction = () => null;
			const params = { a: 'foo' };
			const meta = 'bar';
			const execution = () => autoLogAction(callFunction)(params, meta);
			expect(execution).toThrowErrorMatchingSnapshot();
		});
	});
});

describe('autoLogActions', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('decorate each method correctly', async () => {
		const callFunctionA = jest.fn();
		const callFunctionB = jest.fn();
		const enhancedService = autoLogActions({
			callFunctionA,
			callFunctionB,
		});
		const paramsA = { test: 'a' };
		const paramsB = { test: 'b' };
		const meta = { operation: 'test' };
		await enhancedService.callFunctionA(paramsA, meta);
		await enhancedService.callFunctionB(paramsB, meta);
		expect(enhancedService.callFunctionA.name).toBe('callFunctionA');
		expect(enhancedService.callFunctionB.name).toBe('callFunctionB');
		expect(callFunctionA.mock.calls).toHaveLength(1);
		expect(callFunctionA.mock.calls[0]).toEqual([paramsA, meta]);
		expect(callFunctionB.mock.calls).toHaveLength(1);
		expect(callFunctionB.mock.calls[0]).toEqual([paramsB, meta]);
		expect(logger.info.mock.calls).toHaveLength(4);
		expect(logger.info.mock.calls[1][0]).toEqual({
			...meta,
			...paramsA,
			action: 'mockConstructor',
			result: RESULTS.SUCCESS,
		});
	});
});
