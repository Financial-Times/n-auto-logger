import logger from '../index';
import logAction from '../log-action';

jest.mock('@financial-times/n-logger');

describe('logAction', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('can enhance sync actionFunction', () => {
		const monitorFunction = jest.fn();
		const errorInstance = { message: 'bar' };
		const actionFunction = param => {
			monitorFunction();
			if (!param.input) {
				throw errorInstance;
			}
			return 'foo';
		};
		const enhanced = logAction(actionFunction);
		const param = { input: 'a' };
		const meta = { meta: 'b' };

		it('to log actionFunction name as action name', () => {
			enhanced(param);
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('to invoke actionFunction and return the same result', () => {
			const result = enhanced(param, meta);
			expect(monitorFunction).toHaveBeenCalledTimes(1);
			const expectedResult = actionFunction(param, meta);
			expect(monitorFunction).toHaveBeenCalledTimes(2);
			expect(result).toBe(expectedResult);
		});

		it('to log event when actionFunction success', () => {
			enhanced(param, meta);
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('to log actionFunction failure and throw the caught error', () => {
			try {
				enhanced({}, meta);
			} catch (e) {
				expect(e).toBe(errorInstance);
				expect(logger.error.mock.calls).toMatchSnapshot();
			}
		});
	});

	describe('can enhance async actionFunction', () => {
		const monitorFunction = jest.fn();
		const errorInstance = { message: 'bar' };
		const actionFunction = async param => {
			await monitorFunction();
			if (!param.input) {
				throw errorInstance;
			}
			return 'foo';
		};
		const enhanced = logAction(actionFunction);
		const param = { input: 'a' };
		const meta = { meta: 'b' };

		it('to log actionFunction name as action name', async () => {
			await enhanced(param);
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('to invoke actionFunction and return the same result', async () => {
			const result = await enhanced(param, meta);
			expect(monitorFunction).toHaveBeenCalledTimes(1);
			const expectedResult = await actionFunction(param, meta);
			expect(monitorFunction).toHaveBeenCalledTimes(2);
			expect(result).toBe(expectedResult);
		});

		it('to log event when actionFunction success', async () => {
			await enhanced(param, meta);
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('to log actionFunction failure and throw the caught error', async () => {
			try {
				await enhanced({}, meta);
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
