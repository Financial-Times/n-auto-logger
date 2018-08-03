import logger from '../index';
import logAction from '../action-enhancement';
import { RESULTS } from '../constants';

jest.mock('@financial-times/n-logger');

describe('logAction', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('logs callFunction name as action name', async () => {
		const callFunction = () => null;
		logAction(callFunction)();
		expect(logger.info.mock.calls[1][0]).toEqual({
			action: 'callFunction',
			result: RESULTS.SUCCESS,
		});
	});

	describe('async function', () => {
		it('should invoke callFunction correctly', async () => {
			const callFunction = jest.fn(() => Promise.resolve('foo'));
			const params = { test: 'a' };
			const meta = { meta: 'b' };
			const result = await logAction(callFunction)(params, meta);
			expect(callFunction.mock.calls).toMatchSnapshot();
			const expectedResult = await callFunction(params, meta);
			expect(result).toBe(expectedResult);
		});

		it('should log callFunction success correctly', async () => {
			const callFunction = () => Promise.resolve('foo');
			const params = { test: 'a' };
			const meta = { meta: 'b' };
			await logAction(callFunction)(params, meta);
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
				await logAction(callFunction)(params, meta);
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
			const result = logAction(callFunction)(params, meta);
			expect(callFunction.mock.calls).toMatchSnapshot();
			const expectedResult = callFunction(params, meta);
			expect(result).toBe(expectedResult);
		});

		it('should log callFunction success correctly', () => {
			const callFunction = () => 'foo';
			const params = { test: 'a' };
			const meta = { meta: 'b' };
			logAction(callFunction)(params, meta);
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
				logAction(callFunction)(params, meta);
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
			const enhanced = args => logAction(callFunction)(args);
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

		it('should log callFunction with lazy signature correctly', async () => {
			const callFunction = ({ paramA, meta }) => ({ paramA, ...meta });
			const enhanced = logAction(callFunction);
			const params = { paramA: 'foo' };
			const meta = { b: 'bar' };
			await enhanced({ ...params, meta });
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it("should throw error if there're more than 2 args", () => {
			const callFunction = () => null;
			const params = { a: 'test' };
			const meta = { b: 'k' };
			const random = 'test';
			const execution = () => logAction(callFunction)(params, meta, random);
			expect(execution).toThrowErrorMatchingSnapshot();
		});

		it('should log error if input arg params is not an Object', () => {
			const callFunction = () => null;
			const params = 'test';
			const meta = { b: 'k' };
			const execution = () => logAction(callFunction)(params, meta);
			expect(execution).toThrowErrorMatchingSnapshot();
		});

		it('should log error if input arg meta is specified but not an Object', () => {
			const callFunction = () => null;
			const params = { a: 'foo' };
			const meta = 'bar';
			const execution = () => logAction(callFunction)(params, meta);
			expect(execution).toThrowErrorMatchingSnapshot();
		});
	});
});
