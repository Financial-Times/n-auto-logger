import logger from '../index';
import logAction from '../log-action';
import { RESULTS } from '../constants';

jest.mock('@financial-times/n-logger');

describe('logAction', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('can enhance sync actionFunction', () => {
		it('log actionFunction name as action name', () => {
			const actionFunction = () => null;
			logAction(actionFunction)();
			expect(logger.info.mock.calls[1][0]).toEqual({
				action: 'actionFunction',
				result: RESULTS.SUCCESS,
			});
		});

		it('to invoke actionFunction and return the same result', () => {
			const actionFunction = jest.fn(() => 'foo');
			const param = { test: 'a' };
			const meta = { meta: 'b' };
			const result = logAction(actionFunction)(param, meta);
			expect(actionFunction.mock.calls).toMatchSnapshot();
			const expectedResult = actionFunction(param, meta);
			expect(result).toBe(expectedResult);
		});

		it('to log event when actionFunction success', () => {
			const actionFunction = () => 'foo';
			const param = { test: 'a' };
			const meta = { meta: 'b' };
			logAction(actionFunction)(param, meta);
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('to log actionFunction failure and throw the caught error', () => {
			const errorInstance = { message: 'bar' };
			const actionFunction = () => {
				throw errorInstance;
			};
			const param = { test: 'a' };
			const meta = { meta: 'b' };
			try {
				logAction(actionFunction)(param, meta);
			} catch (e) {
				expect(e).toBe(errorInstance);
				expect(logger.error.mock.calls).toMatchSnapshot();
			}
		});
	});

	describe('can enhance async actionFunction', () => {
		it('log actionFunction name as action name', async () => {
			const actionFunction = async () => null;
			await logAction(actionFunction)();
			expect(logger.info.mock.calls[1][0]).toEqual({
				action: 'actionFunction',
				result: RESULTS.SUCCESS,
			});
		});

		it('to invoke actionFunction and return the same result', async () => {
			const actionFunction = jest.fn(async () => 'foo');
			const param = { test: 'a' };
			const meta = { meta: 'b' };
			const result = await logAction(actionFunction)(param, meta);
			expect(actionFunction.mock.calls).toMatchSnapshot();
			const expectedResult = await actionFunction(param, meta);
			expect(result).toBe(expectedResult);
		});

		it('to log event when actionFunction success', async () => {
			const actionFunction = async () => 'foo';
			const param = { test: 'a' };
			const meta = { meta: 'b' };
			await logAction(actionFunction)(param, meta);
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('to log actionFunction failure and throw the caught error', async () => {
			const errorInstance = { message: 'bar' };
			const actionFunction = async () => {
				throw errorInstance;
			};
			const param = { test: 'a' };
			const meta = { meta: 'b' };
			try {
				await logAction(actionFunction)(param, meta);
			} catch (e) {
				expect(e).toBe(errorInstance);
				expect(logger.error.mock.calls).toMatchSnapshot();
			}
		});
	});

	describe('throw erros if enhancedFunction has invalid input args', () => {
		it('with more than 2 args', () => {
			const actionFunction = () => null;
			const params = { a: 'test' };
			const meta = { b: 'k' };
			const random = 'test';
			const execution = () => logAction(actionFunction)(params, meta, random);
			expect(execution).toThrowErrorMatchingSnapshot();
		});

		it('with non-Object as first arg (param)', () => {
			const callFunction = () => null;
			const params = 'test';
			const meta = { b: 'k' };
			const execution = () => logAction(callFunction)(params, meta);
			expect(execution).toThrowErrorMatchingSnapshot();
		});

		it('with non-Object as second arg (meta)', () => {
			const callFunction = () => null;
			const params = { a: 'foo' };
			const meta = 'bar';
			const execution = () => logAction(callFunction)(params, meta);
			expect(execution).toThrowErrorMatchingSnapshot();
		});
	});
});
