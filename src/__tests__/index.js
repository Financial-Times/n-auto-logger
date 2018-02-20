import logger, { loggerEvent, autoLog, autoLogService } from '../index';
import { CATEGORIES, RESULTS } from '../constants';

jest.mock('@financial-times/n-logger');

describe('n-auto-logger', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('loggerEvent', () => {
		const commonMeta = {
			operation: 'test',
			action: '',
			userId: 'test',
			transactionId: 'test',
			a: 'test',
			b: 'test',
		};

		const commonTrimmedMeta = {
			operation: 'test',
			userId: 'test',
			transactionId: 'test',
			a: 'test',
			b: 'test',
		};

		describe('fires logger', () => {
			it('info when initialised', () => {
				loggerEvent(commonMeta);
				expect(logger.info.mock.calls).toHaveLength(1);
				expect(logger.info.mock.calls[0][0]).toEqual(commonTrimmedMeta);
			});

			it('info with .success()', () => {
				const event = loggerEvent(commonMeta);
				event.success({ d: 'some data', e: 'some other data' });
				expect(logger.info.mock.calls).toHaveLength(2);
				expect(logger.info.mock.calls[1][0]).toEqual({
					...commonTrimmedMeta,
					result: RESULTS.SUCCESS,
					data: { d: 'some data', e: 'some other data' },
				});
			});

			it('failureLogger with .failure()', () => {
				const event = loggerEvent(commonMeta);
				event.failure({ message: 'some error message' });
				expect(logger.info.mock.calls).toHaveLength(1);
				expect(logger.error.mock.calls[0][0]).toEqual({
					...commonTrimmedMeta,
					result: RESULTS.FAILURE,
					category: CATEGORIES.CUSTOM_ERROR,
					message: 'some error message',
				});
			});
		});

		describe('filter in input meta data of', () => {
			it('empty or undefined field', () => {
				loggerEvent(commonMeta);
				expect(logger.info.mock.calls).toHaveLength(1);
				expect(logger.info.mock.calls[0][0]).toEqual(commonTrimmedMeta);
			});

			it('fields defined in LOGGER_MUTE_FIELDS', () => {
				process.env.LOGGER_MUTE_FIELDS = 'transactionId, userId';
				const mutedMeta = {
					operation: 'test',
					a: 'test',
					b: 'test',
				};
				loggerEvent(commonMeta);
				expect(logger.info.mock.calls).toHaveLength(1);
				expect(logger.info.mock.calls[0][0]).toEqual(mutedMeta);
				delete process.env.LOGGER_MUTE_FIELDS;
			});

			it('data nested in user field', () => {
				const commonMetaWithUser = {
					...commonMeta,
					user: { message: 'please ask help center' },
				};
				loggerEvent(commonMetaWithUser);
				expect(logger.info.mock.calls).toHaveLength(1);
				expect(logger.info.mock.calls[0][0]).toEqual(commonTrimmedMeta);
			});
		});

		describe('.action()', () => {
			it('.start() creates logger.info()', () => {
				const event = loggerEvent(commonMeta);
				event.action('someAction').start();
				expect(logger.info.mock.calls).toHaveLength(2);
				expect(logger.info.mock.calls[1][0]).toEqual({
					...commonTrimmedMeta,
					action: 'someAction',
				});
			});

			it('.success() creates logger.info()', () => {
				const event = loggerEvent(commonMeta);
				event.action('someAction').success({ returnData: 'someReturnData' });
				expect(logger.info.mock.calls).toHaveLength(2);
				expect(logger.info.mock.calls[1][0]).toEqual({
					...commonTrimmedMeta,
					action: 'someAction',
					result: RESULTS.SUCCESS,
					data: { returnData: 'someReturnData' },
				});
			});

			it('.failure() fires failureLogger', () => {
				const event = loggerEvent(commonMeta);
				event
					.action('someAction')
					.failure({ status: 400, reason: 'some action error message' });
				expect(logger.info.mock.calls).toHaveLength(1);
				expect(logger.warn.mock.calls[0][0]).toEqual({
					...commonTrimmedMeta,
					category: CATEGORIES.CUSTOM_ERROR,
					status: 400,
					action: 'someAction',
					result: RESULTS.FAILURE,
					reason: 'some action error message',
				});
			});
		});
	});

	describe('autoLog', () => {
		it('logs callFunction name as action name', async () => {
			const callFunction = () => null;
			autoLog(callFunction)();
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
				const result = await autoLog(callFunction)(params, meta);
				expect(callFunction.mock.calls).toMatchSnapshot();
				const expectedResult = await callFunction(params, meta);
				expect(result).toBe(expectedResult);
			});

			it('should log callFunction success correctly', async () => {
				const callFunction = () => Promise.resolve('foo');
				const params = { test: 'a' };
				const meta = { meta: 'b' };
				await autoLog(callFunction)(params, meta);
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
					await autoLog(callFunction)(params, meta);
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
				const result = autoLog(callFunction)(params, meta);
				expect(callFunction.mock.calls).toMatchSnapshot();
				const expectedResult = callFunction(params, meta);
				expect(result).toBe(expectedResult);
			});

			it('should log callFunction success correctly', () => {
				const callFunction = () => 'foo';
				const params = { test: 'a' };
				const meta = { meta: 'b' };
				autoLog(callFunction)(params, meta);
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
					autoLog(callFunction)(params, meta);
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
				const enhanced = args => autoLog(callFunction)(args);
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
				const execution = () => autoLog(callFunction)(params, meta, random);
				expect(execution).toThrowErrorMatchingSnapshot();
			});

			it('should log error if input arg params is not an Object', () => {
				const callFunction = () => null;
				const params = 'test';
				const meta = { b: 'k' };
				const execution = () => autoLog(callFunction)(params, meta);
				expect(execution).toThrowErrorMatchingSnapshot();
			});

			it('should log error if input arg meta is specified but not an Object', () => {
				const callFunction = () => null;
				const params = { a: 'foo' };
				const meta = 'bar';
				const execution = () => autoLog(callFunction)(params, meta);
				expect(execution).toThrowErrorMatchingSnapshot();
			});
		});
	});

	describe('autoLogService', () => {
		it('decorate each method correctly', async () => {
			const callFunctionA = jest.fn();
			const callFunctionB = jest.fn();
			const enhancedService = autoLogService({
				callFunctionA,
				callFunctionB,
			});
			const paramsA = { test: 'a' };
			const paramsB = { test: 'b' };
			const meta = { operation: 'test' };
			await enhancedService.callFunctionA(paramsA, meta);
			await enhancedService.callFunctionB(paramsB, meta);
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
});
