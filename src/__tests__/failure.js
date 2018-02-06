import logger from '@financial-times/n-logger';
import { Response, Headers, FetchError } from 'node-fetch';
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
		const headers = new Headers();
		headers.append('content-type', 'text/plain; charset=utf-8');
		const errorResponse403 = new Response('403 Forbidden', {
			status: 403,
			headers,
		});
		await failureLogger()(errorResponse403);
		expect(logger.warn.mock.calls).toHaveLength(1);
		expect(logger.warn.mock.calls[0][0]).toMatchSnapshot();

		const errorResponse500 = new Response('500 Internal Server Error', {
			status: 500,
			headers,
		});
		await failureLogger()(errorResponse500);
		expect(logger.warn.mock.calls).toHaveLength(1);
		expect(logger.error.mock.calls).toHaveLength(1);
		expect(logger.error.mock.calls[0][0]).toMatchSnapshot();
	});

	it('log fetch network error correctly', async () => {
		const e = new FetchError(
			'request to https://unknown/ failed, reason: getaddrinfo ENOTFOUND unknown unknown:443',
		);
		e.code = 'ENOTFOUND';
		await failureLogger()(e);
		expect(logger.error.mock.calls).toHaveLength(1);
		expect(logger.error.mock.calls[0][0]).toMatchSnapshot();
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

	it('log other exceptions not described as object correctly', async () => {
		await failureLogger()('some error message');
		expect(logger.warn.mock.calls).toHaveLength(1);
		expect(logger.warn.mock.calls[0][0]).toMatchSnapshot();
	});
});
