import logger from '../index';
import logOperation from '../log-operation';

jest.mock('@financial-times/n-logger');

describe('logOperation', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('can enhance sync operationFunction', () => {
		const monitorFunction = jest.fn();
		const errorInstance = { status: 404, message: 'Not Found' };
		const operationFunction = (req, res) => {
			monitorFunction(req.meta);
			if (req.error) {
				throw errorInstance;
			}
			res.send();
		};
		const enhancedOperation = logOperation(operationFunction);
		const mockRes = {
			send: jest.fn(),
		};
		const errorReq = {
			error: true,
		};

		it('to log operationFunction name as operation name', () => {
			enhancedOperation({}, mockRes);
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('to invoke operationFunction with operationFunction name in req.meta.operation', () => {
			enhancedOperation({}, mockRes);
			expect(monitorFunction.mock.calls).toMatchSnapshot();
			expect(mockRes.send.mock.calls).toMatchSnapshot();
		});

		it('to log operaitonFunction on success', () => {
			enhancedOperation({}, mockRes);
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('inherit meta passed to req.meta from previous middleware and log them', () => {
			const reqWithMeta = { meta: { userId: 'mock-id' } };
			enhancedOperation(reqWithMeta, mockRes);
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('to log operationFunction on failure and throw the caught error', async () => {
			try {
				await enhancedOperation(errorReq, mockRes);
			} catch (e) {
				expect(e).toBe(errorInstance);
				expect(logger.error.mock.calls).toMatchSnapshot();
				expect(logger.warn.mock.calls).toMatchSnapshot();
			}
		});
	});

	describe('can enhance async operationFunction', () => {
		const monitorFunction = jest.fn();
		const errorInstance = { status: 404, message: 'Not Found' };
		const operationFunction = async (req, res) => {
			await monitorFunction(req.meta);
			if (req.error) {
				throw errorInstance;
			}
			res.send();
		};
		const enhancedOperation = logOperation(operationFunction);
		const mockRes = {
			send: jest.fn(),
		};
		const errorReq = {
			error: true,
		};

		it('to log operationFunction name as operation name', async () => {
			await enhancedOperation({}, mockRes);
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('to invoke operationFunction with operationFunction name in req.meta.operation', async () => {
			await enhancedOperation({}, mockRes);
			expect(monitorFunction.mock.calls).toMatchSnapshot();
			expect(mockRes.send).toHaveBeenCalled();
		});

		it('to log operaitonFunction on success', async () => {
			await enhancedOperation({}, mockRes);
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('inherit meta passed to req.meta from previous middleware and log them', async () => {
			const reqWithMeta = { meta: { userId: 'mock-id' } };
			await enhancedOperation(reqWithMeta, mockRes);
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('to log operationFunction on failure and throw the caught error', async () => {
			try {
				await enhancedOperation(errorReq, mockRes);
			} catch (e) {
				expect(e).toBe(errorInstance);
				expect(logger.error.mock.calls).toMatchSnapshot();
				expect(logger.warn.mock.calls).toMatchSnapshot();
			}
		});
	});
});
