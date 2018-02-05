import logger from '@financial-times/n-logger';
import fetch from 'node-fetch';
import failureLogger from '../failure';

jest.mock('@financial-times/n-logger');

describe('failureLogger', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('log without an error object input correctly', async () => {
		const context = {
			operation: 'someOperation',
			action: 'someAction',
		};
		await failureLogger(context)();
		expect(logger.warn.mock.calls).toHaveLength(1);
		expect(logger.warn.mock.calls[0][0]).toMatchSnapshot();
	});

	it('log fetch response error correctly based on status', async () => {
		try {
			const response = await fetch('https://httpstat.us/403');
			if (!response.ok) {
				throw response;
			}
		} catch (e) {
			await failureLogger()(e);
			expect(logger.warn.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls[0][0]).toMatchSnapshot();
		}

		try {
			const response = await fetch('https://httpstat.us/500');
			if (!response.ok) {
				throw response;
			}
		} catch (e) {
			await failureLogger()(e);
			expect(logger.warn.mock.calls).toHaveLength(1);
			expect(logger.error.mock.calls).toHaveLength(1);
			expect(logger.error.mock.calls[0][0]).toMatchSnapshot();
		}
	});

	it('log fetch network error correctly', async () => {
		try {
			await fetch('https://unknown');
		} catch (e) {
			await failureLogger()(e);
			expect(logger.error.mock.calls).toHaveLength(1);
			expect(logger.error.mock.calls[0][0]).toMatchSnapshot();
		}
	});

	it('log exception based on its status correctly', async () => {
		try {
			const formattedError = {
				status: 500,
				message: 'some message to describe the case',
			};
			throw formattedError;
		} catch (e) {
			await failureLogger()(e);
			expect(logger.error.mock.calls).toHaveLength(1);
			expect(logger.error.mock.calls[0][0]).toMatchSnapshot();
		}

		try {
			const formattedError = {
				status: 404,
				message: 'some message to describe the case',
			};
			throw formattedError;
		} catch (e) {
			await failureLogger()(e);
			expect(logger.error.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls[0][0]).toMatchSnapshot();
		}
	});

	it('log node system error correctly', async () => {
		const event = {
			operation: 'someOperation',
		};
		try {
			const systemError = new Error('some error message');
			throw systemError;
		} catch (e) {
			await failureLogger(event)(e);
			expect(logger.error.mock.calls).toHaveLength(1);
			expect(logger.error.mock.calls[0][0]).toMatchObject({
				message: 'some error message',
				result: 'failure',
				category: 'NODE_SYSTEM_ERROR',
			});
		}
	});

	it('log unformatted exception correctly', async () => {
		try {
			const unformattedException = {
				message: 'aha',
			};
			throw unformattedException;
		} catch (e) {
			await failureLogger()(e);
			expect(logger.warn.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls[0][0]).toMatchSnapshot();
		}
	});
});
