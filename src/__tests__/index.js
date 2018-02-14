import logger, { loggerEvent, autoLog, autoLogService } from '../index';

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

		it('should trim excessive field in event meta for logger', () => {
			loggerEvent(commonMeta);
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.info.mock.calls[0][0]).toEqual(commonTrimmedMeta);
		});

		it('should suppress configured meta field for development', () => {
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

		it('should NOT ignore data put under user field', () => {
			const commonMetaWithUser = {
				...commonMeta,
				user: { message: 'please ask help center' },
			};
			loggerEvent(commonMetaWithUser);
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('should fire info when initialised', () => {
			loggerEvent(commonMeta);
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.info.mock.calls[0][0]).toEqual(commonTrimmedMeta);
		});

		it('should create the correct logger when fire the success method', () => {
			const event = loggerEvent(commonMeta);
			event.success({ d: 'some data', e: 'some other data' });
			expect(logger.info.mock.calls).toHaveLength(2);
			expect(logger.info.mock.calls[1][0]).toEqual({
				...commonTrimmedMeta,
				result: 'success',
				data: { d: 'some data', e: 'some other data' },
			});
		});

		it('should create the correct logger when fire the failure method', () => {
			const event = loggerEvent(commonMeta);
			event.failure({ message: 'some error message' });
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls[0][0]).toEqual({
				...commonTrimmedMeta,
				result: 'failure',
				category: 'EXCEPTION',
				message: 'some error message',
			});
		});

		it('failure method should log system Error correctly', () => {
			const event = loggerEvent(commonMeta);
			event.failure(new Error('some error message'));
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.error.mock.calls[0][0]).toMatchObject({
				...commonTrimmedMeta,
				result: 'failure',
				category: 'NODE_SYSTEM_ERROR',
				message: 'some error message',
			});
			expect(logger.error.mock.calls[0][0]).toHaveProperty('stack');
		});

		it('failure method should log custom Error correctly', () => {
			const event = loggerEvent(commonMeta);
			event.failure({ status: 400, reason: 'not found' });
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls[0][0]).toEqual({
				...commonTrimmedMeta,
				category: 'EXCEPTION',
				result: 'failure',
				status: 400,
				reason: 'not found',
			});
		});

		it('should supports fire action start log', () => {
			const event = loggerEvent(commonMeta);
			event.action('someAction').start();
			expect(logger.info.mock.calls).toHaveLength(2);
			expect(logger.info.mock.calls[1][0]).toEqual({
				...commonTrimmedMeta,
				action: 'someAction',
			});
		});

		it('should supports fire action success log', () => {
			const event = loggerEvent(commonMeta);
			event.action('someAction').success({ returnData: 'someReturnData' });
			expect(logger.info.mock.calls).toHaveLength(2);
			expect(logger.info.mock.calls[1][0]).toEqual({
				...commonTrimmedMeta,
				action: 'someAction',
				result: 'success',
				data: { returnData: 'someReturnData' },
			});
		});

		it('should supports fire action failure log', () => {
			const event = loggerEvent(commonMeta);
			event
				.action('someAction')
				.failure({ status: 400, reason: 'some action error message' });
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls[0][0]).toEqual({
				...commonTrimmedMeta,
				category: 'EXCEPTION',
				status: 400,
				action: 'someAction',
				result: 'failure',
				reason: 'some action error message',
			});
		});

		it('should supports action fire failure log with empty error object', () => {
			const event = loggerEvent(commonMeta);
			event.action('someAction').failure();
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls[0][0]).toEqual({
				...commonTrimmedMeta,
				action: 'someAction',
				result: 'failure',
			});
		});

		it('log error with correct level according to error code', () => {
			const event = loggerEvent(commonMeta);
			event
				.action('someAction')
				.failure({ reason: 'some action error message', status: 500 });
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls).toHaveLength(0);
			expect(logger.error.mock.calls[0][0]).toEqual({
				...commonTrimmedMeta,
				action: 'someAction',
				result: 'failure',
				category: 'EXCEPTION',
				status: 500,
				reason: 'some action error message',
			});
		});
	});

	describe('autoLog', () => {
		it('should invoke autoLogged async callFunction correctly', async () => {
			const callFunction = jest.fn(() => Promise.resolve('foo'));
			const params = { test: 'a' };
			const meta = { meta: 'b' };
			const result = await autoLog(callFunction)(params, meta);
			expect(callFunction.mock.calls).toMatchSnapshot();
			const expectedResult = await callFunction(params, meta);
			expect(result).toBe(expectedResult);
		});

		it('should log async callFunction success correctly', async () => {
			const callFunction = () => Promise.resolve('foo');
			const params = { test: 'a' };
			const meta = { meta: 'b' };
			await autoLog(callFunction)(params, meta);
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('should log async callFunction failure correctly and throw the original exception', async () => {
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
				expect(logger.warn.mock.calls).toMatchSnapshot();
			}
		});

		it('should invoke non-async callFunction correctly', () => {
			const callFunction = jest.fn(() => 'foo');
			const params = { test: 'a' };
			const meta = { meta: 'b' };
			const result = autoLog(callFunction)(params, meta);
			expect(callFunction.mock.calls).toMatchSnapshot();
			const expectedResult = callFunction(params, meta);
			expect(result).toBe(expectedResult);
		});

		it('should log non-async callFunction success correctly', () => {
			const callFunction = () => 'foo';
			const params = { test: 'a' };
			const meta = { meta: 'b' };
			autoLog(callFunction)(params, meta);
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('should log non-async callFunction failure correctly and throw the original exception', () => {
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
				expect(logger.warn.mock.calls).toHaveLength(1);
				expect(logger.warn.mock.calls).toMatchSnapshot();
			}
		});

		it('logs callFunction name as action name', async () => {
			const callFunction = () => null;
			autoLog(callFunction)();
			expect(logger.info.mock.calls[1][0]).toEqual({
				action: 'callFunction',
				result: 'success',
			});
		});

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
				result: 'success',
			});
			await enhanced(params);
			expect(logger.info.mock.calls[3][0]).toEqual({
				...params,
				action: 'callFunction',
				result: 'success',
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
				result: 'success',
			});
		});
	});
});
