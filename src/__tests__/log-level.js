import logger, { logAction, logOperation } from '../index';
import { LOG_LEVELS } from '../constants';

jest.mock('@financial-times/n-logger');

const commonErrorInstance = { status: 404, message: 'Not Found' };

const runCommonTestCases = () => {
	describe('success of', () => {
		it('async function with async sub actions', async () => {
			const callFunction = () => Promise.resolve('foo');
			const operationFunction = async meta => {
				await logAction(callFunction)(null, meta);
			};
			const enhanced = logOperation(operationFunction);
			await enhanced();
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('non-async function with non async sub actions', async () => {
			const callFunction = () => {};
			const operationFunction = meta => {
				logAction(callFunction)(null, meta);
			};
			const enhanced = logOperation(operationFunction);
			await enhanced();
			expect(logger.info.mock.calls).toMatchSnapshot();
		});
	});

	describe('failure of', () => {
		it('non-async function with non-async sub actions', async () => {
			const callFunction = () => {
				throw commonErrorInstance;
			};
			const operationFunction = meta => {
				try {
					logAction(callFunction)(null, meta);
				} catch (e) {
					throw e;
				}
			};
			const enhanced = logOperation(operationFunction);
			try {
				await enhanced();
			} catch (e) {
				expect(logger.info.mock.calls).toMatchSnapshot();
				expect(logger.warn.mock.calls).toMatchSnapshot();
				expect(logger.error.mock.calls).toMatchSnapshot();
			}
		});

		it('async function with async sub actions', async () => {
			const callFunction = async () => {
				throw commonErrorInstance;
			};
			const operationFunction = async meta => {
				try {
					await logAction(callFunction)(null, meta);
				} catch (e) {
					throw e;
				}
			};
			const enhanced = logOperation(operationFunction);
			try {
				await enhanced();
			} catch (e) {
				expect(logger.info.mock.calls).toMatchSnapshot();
				expect(logger.warn.mock.calls).toMatchSnapshot();
				expect(logger.error.mock.calls).toMatchSnapshot();
			}
		});
	});
};

describe('AUTO_LOG_LEVEL', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('=verbose logs every stage of operation and action', () => {
		beforeAll(() => {
			process.env.AUTO_LOG_LEVEL = LOG_LEVELS.verbose;
		});

		afterAll(() => {
			delete process.env.AUTO_LOG_LEVEL;
		});

		runCommonTestCases();
	});

	describe('=concise logs success/failure of operation and only failure of action ', () => {
		beforeAll(() => {
			process.env.AUTO_LOG_LEVEL = LOG_LEVELS.concise;
		});

		afterAll(() => {
			delete process.env.AUTO_LOG_LEVEL;
		});

		runCommonTestCases();
	});

	describe('=error logs only failure of operation and action', () => {
		beforeAll(() => {
			process.env.AUTO_LOG_LEVEL = LOG_LEVELS.error;
		});

		afterAll(() => {
			delete process.env.AUTO_LOG_LEVEL;
		});

		runCommonTestCases();
	});
});
