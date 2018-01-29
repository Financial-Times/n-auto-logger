import logger from '@financial-times/n-logger';
import { loggerEvent, withLogger, withServiceLogger } from '../index';

jest.mock('@financial-times/n-logger');

describe('n-event-logger', () => {
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

		it('should fire info when initialised', () => {
			loggerEvent(commonMeta);
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.info.mock.calls[0][0]).toMatchObject(commonMeta);
		});

		it('should create the correct logger when fire the success method', () => {
			const event = loggerEvent(commonMeta);
			event.success({ d: 'some data' });
			expect(logger.info.mock.calls).toHaveLength(2);
			expect(logger.info.mock.calls[1][0]).toMatchObject({
				...commonMeta,
				result: 'success',
				data: { d: 'some data' },
			});
		});

		it('should create the correct logger when fire the failure method', () => {
			const event = loggerEvent(commonMeta);
			event.failure({ message: 'some error message' });
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls[0][0]).toMatchObject({
				...commonMeta,
				result: 'failure',
				message: 'some error message',
			});
		});

		it('should supports fire action start log', () => {
			const event = loggerEvent(commonMeta);
			event.action('someAction').start();
			expect(logger.info.mock.calls).toHaveLength(2);
			expect(logger.info.mock.calls[1][0]).toMatchObject({
				...commonMeta,
				action: 'someAction',
			});
		});

		it('should supports fire action success log', () => {
			const event = loggerEvent(commonMeta);
			event.action('someAction').success({ returnData: 'someReturnData' });
			expect(logger.info.mock.calls).toHaveLength(2);
			expect(logger.info.mock.calls[1][0]).toMatchObject({
				...commonMeta,
				action: 'someAction',
				result: 'success',
				data: { returnData: 'someReturnData' },
			});
		});

		it('should supports fire action failure log', () => {
			const event = loggerEvent(commonMeta);
			event
				.action('someAction')
				.failure({ message: 'some action error message' });
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls[0][0]).toMatchObject({
				...commonMeta,
				action: 'someAction',
				result: 'failure',
				message: 'some action error message',
			});
		});

		it('log error with correct level according to error code', () => {
			const event = loggerEvent(commonMeta);
			event
				.action('someAction')
				.failure({ message: 'some action error message', status: 500 });
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls).toHaveLength(0);
			expect(logger.error.mock.calls[0][0]).toMatchObject({
				...commonMeta,
				action: 'someAction',
				result: 'failure',
				message: 'some action error message',
			});
		});
	});

	describe('withLogger', () => {
		it('decorates the callFunction correctly', async () => {
			const callFunction = jest.fn(() => Promise.resolve('foo'));
			const enhanced = (params, meta) =>
				withLogger(meta)(callFunction)(params, meta);
			const params = { test: 'a' };
			const meta = { meta: 'b' };
			const result = await enhanced(params, meta);
			expect(callFunction.mock.calls).toHaveLength(1);
			expect(callFunction.mock.calls[0]).toEqual([params, meta]);
			expect(result).toBe('foo');
			expect(logger.info.mock.calls).toHaveLength(2);
			expect(logger.info.mock.calls[1][0]).toMatchObject({
				...meta,
				...params,
				action: 'mockConstructor',
				result: 'success',
			});
		});

		it('reports callFunction error correctly', async () => {
			const callFunction = jest.fn(() => Promise.reject(Error('bar')));
			const enhanced = (params, meta) =>
				withLogger(meta)(callFunction)(params, meta);
			const params = { test: 'a' };
			const meta = { meta: 'b' };
			try {
				await enhanced(params, meta);
			} catch (e) {
				expect(callFunction.mock.calls).toHaveLength(1);
				expect(callFunction.mock.calls[0]).toEqual([params, meta]);
				expect(e).toBeInstanceOf(Error);
				expect(logger.info.mock.calls).toHaveLength(1);
				expect(logger.info.mock.calls[0][0]).toMatchObject({
					...meta,
					...params,
					action: 'mockConstructor',
				});
				expect(logger.warn.mock.calls).toHaveLength(1);
				expect(logger.warn.mock.calls[0][0]).toMatchObject({
					...meta,
					...params,
					action: 'mockConstructor',
					result: 'failure',
				});
			}
		});

		it('logs callFunction name as action name', async () => {
			const callFunction = () => null;
			const enhanced = (params, meta) =>
				withLogger(meta)(callFunction)(params, meta);
			const params = { test: 'a' };
			const meta = { meta: 'b' };
			await enhanced(params, meta);
			expect(logger.info.mock.calls[1][0]).toMatchObject({
				...meta,
				...params,
				action: 'callFunction',
				result: 'success',
			});
		});

		it('supports action name override', async () => {
			const callFunction = jest.fn(() => Promise.resolve('foo'));
			const enhanced = (params, meta) =>
				withLogger(meta)(callFunction)(params, meta);
			const params = { test: 'a' };
			const meta = { meta: 'b', action: 'callFunction' };
			await enhanced(params, meta);
			expect(logger.info.mock.calls[1][0]).toMatchObject({
				...meta,
				...params,
				action: 'callFunction',
				result: 'success',
			});
		});

		it('should NOT fail given empty meta', async () => {
			const callFunction = () => null;
			const enhanced = (params, meta) =>
				withLogger(meta)(callFunction)(params, meta);
			const params = { test: 'a' };
			await enhanced(params);
			expect(logger.info.mock.calls[1][0]).toMatchObject({
				...params,
				action: 'callFunction',
				result: 'success',
			});
		});
	});

	describe('withServiceLogger', () => {
		it('decorate each method correctly', async () => {
			const callFunctionA = jest.fn();
			const callFunctionB = jest.fn();
			const enhancedService = withServiceLogger({
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
			expect(logger.info.mock.calls[1][0]).toMatchObject({
				...meta,
				...paramsA,
				action: 'mockConstructor',
				result: 'success',
			});
		});
	});
});
