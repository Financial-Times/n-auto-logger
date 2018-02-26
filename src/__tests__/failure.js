import logger from '@financial-times/n-logger';
import nError from '@financial-times/n-error';
import { Response, Headers, FetchError } from 'node-fetch';

import failureLogger from '../failure';
import { CATEGORIES } from '../constants';
import { assertErrorLog } from '../utils';

jest.mock('@financial-times/n-logger');

class ExtendedError extends Error {
	constructor({ status = 500, message, method, category, user, action } = {}) {
		super(message);
		this.name = 'ExtendedError';
		this.status = status;
		this.method = method;
		this.category = category;
		this.action = action;
		this.user = user;
	}
}

describe('failureLogger', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('correctly logs', () => {
		it('null or undefined input', async () => {
			const context = {
				operation: 'someOperation',
				action: 'someAction',
			};
			await failureLogger(context)();
			expect(logger.warn.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls[0][0]).toMatchSnapshot();
		});

		it('fetch response error with status', async () => {
			const headers = new Headers();
			headers.append('content-type', 'text/plain; charset=utf-8');
			const errorResponse500 = new Response('500 Internal Server Error', {
				status: 500,
				headers,
			});
			await failureLogger()(errorResponse500);
			expect(logger.error.mock.calls).toHaveLength(1);
			assertErrorLog(logger.error.mock.calls[0][0]);

			const errorResponse404 = new Response('404 Not Found', {
				status: 404,
				headers,
			});
			await failureLogger()(errorResponse404);
			expect(logger.error.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls).toHaveLength(1);
			assertErrorLog(logger.warn.mock.calls[0][0]);
		});

		it('fetch network error', async () => {
			const e = new FetchError(
				'request to https://unknown/ failed, reason: some reason',
			);
			e.code = 'ENOTFOUND';
			await failureLogger()(e);
			expect(logger.error.mock.calls).toHaveLength(1);
			assertErrorLog(logger.error.mock.calls[0][0]);
		});

		it('Error', async () => {
			const event = {
				operation: 'someOperation',
			};
			const e = new TypeError('some error message');
			await failureLogger(event)(e);
			expect(logger.error.mock.calls).toHaveLength(1);
			assertErrorLog(logger.error.mock.calls[0][0]);
		});

		it('ExtendedErrorError with status', async () => {
			const event = {
				operation: 'someOperation',
			};
			const e = new ExtendedError({ message: 'some error message' });
			await failureLogger(event)(e);
			expect(logger.error.mock.calls).toHaveLength(1);
			assertErrorLog(logger.error.mock.calls[0][0]);

			const ee = new ExtendedError({ status: 404 });
			await failureLogger(event)(ee);
			expect(logger.error.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls).toHaveLength(1);
			assertErrorLog(logger.warn.mock.calls[0][0]);
		});

		it('nError with status', async () => {
			const extendedSystemError = nError({
				status: 500,
				message: 'some error message',
			});
			await failureLogger()(extendedSystemError);
			expect(logger.error.mock.calls).toHaveLength(1);
			assertErrorLog(logger.error.mock.calls[0][0]);

			const extendedSystemError404 = nError({
				status: 404,
				message: 'some error message',
			});
			await failureLogger()(extendedSystemError404);
			expect(logger.error.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls).toHaveLength(1);
			assertErrorLog(logger.warn.mock.calls[0][0]);
		});

		it('plain object with status', async () => {
			const formattedError500 = {
				status: 500,
				message: 'some message to describe the case',
			};
			await failureLogger()(formattedError500);
			expect(logger.error.mock.calls).toHaveLength(1);
			expect(logger.error.mock.calls[0][0]).toMatchSnapshot();

			const formattedError404 = {
				status: 404,
				message: 'some message to describe the case',
			};
			await failureLogger()(formattedError404);
			expect(logger.error.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls[0][0]).toMatchSnapshot();
		});

		it('exceptions not described as object', async () => {
			await failureLogger()('some error message');
			expect(logger.warn.mock.calls).toHaveLength(1);
			expect(logger.warn.mock.calls[0][0]).toMatchSnapshot();
		});
	});

	describe('logs only values from the error object', () => {
		it('ExtendedError with empty fields', async () => {
			const e = new ExtendedError();
			await failureLogger()(e);
			assertErrorLog(logger.error.mock.calls[0][0]);
		});

		// TODO: edge case, assign a method to message wouldn't been clean up
		it('ExtendedError with methods', async () => {
			const e = new ExtendedError({
				method: () => 'test',
			});
			await failureLogger()(e);
			assertErrorLog(logger.error.mock.calls[0][0]);
		});

		it('nError with empty fields', async () => {
			const e = nError({});
			await failureLogger()(e);
			assertErrorLog(logger.error.mock.calls[0][0]);
		});

		it('nError with methods', async () => {
			const e = nError({
				status: 500,
				message: 'some error message',
				extend: () => null,
			});
			await failureLogger()(e);
			expect(logger.error.mock.calls).toHaveLength(1);
			expect(logger.error.mock.calls[0][0].extend).toBeUndefined();
			assertErrorLog(logger.error.mock.calls[0][0]);
		});

		it('plain object with methods', async () => {
			const e = {
				status: 500,
				message: 'some message to describe the case',
				extend: () => null,
			};
			await failureLogger()(e);
			expect(logger.error.mock.calls).toHaveLength(1);
			expect(logger.error.mock.calls[0][0]).toMatchSnapshot();
		});
	});

	describe('hides user field in', () => {
		it('ExtendedError', async () => {
			const e = new ExtendedError({
				user: {
					message: 'some message',
					email: 'some email address',
				},
			});
			await failureLogger()(e);
			expect(logger.error.mock.calls).toHaveLength(1);
			const loggedError = logger.error.mock.calls[0][0];
			expect(loggedError.user).toBeUndefined();
		});

		it('nError', async () => {
			const e = nError({
				user: {
					message: 'some message',
					email: 'some email address',
				},
			});
			await failureLogger()(e);
			expect(logger.error.mock.calls).toHaveLength(1);
			const loggedError = logger.error.mock.calls[0][0];
			expect(loggedError.category).toBe(CATEGORIES.CUSTOM_ERROR);
			expect(loggedError.user).toBeUndefined();
		});

		it('fetch response error', async () => {
			const headers = new Headers();
			headers.append('content-type', 'application/json; charset=utf-8');
			const e = new Response(
				JSON.stringify({ message: 'test', user: { a: 'b' } }),
				{
					status: 500,
					headers,
				},
			);
			await failureLogger()(e);
			expect(logger.error.mock.calls).toHaveLength(1);
			const loggedError = logger.error.mock.calls[0][0];
			expect(loggedError.category).toBe(CATEGORIES.FETCH_RESPONSE_ERROR);
			expect(loggedError.user).toBeUndefined();
		});

		it('plain object', async () => {
			const e = {
				user: {
					message: 'some message',
					email: 'some email address',
				},
			};
			await failureLogger()(e);
			expect(logger.error.mock.calls).toHaveLength(1);
			const loggedError = logger.error.mock.calls[0][0];
			expect(loggedError.category).toBe(CATEGORIES.CUSTOM_ERROR);
			expect(loggedError.user).toBeUndefined();
		});
	});

	describe('mute fields of LOGGER_MUTE_FIELDS including .stack in', () => {
		beforeAll(() => {
			process.env.LOGGER_MUTE_FIELDS = 'action, stack, result';
		});

		afterAll(() => {
			delete process.env.LOGGER_MUTE_FIELDS;
		});

		it('ExtendedError', async () => {
			const e = new ExtendedError({ action: 'SOME_ACTION' });
			await failureLogger()(e);
			expect(logger.error.mock.calls).toHaveLength(1);
			const loggedError = logger.error.mock.calls[0][0];
			expect(loggedError.stack).toBeUndefined();
			expect(loggedError).toMatchSnapshot();
		});

		it('nError', async () => {
			const e = nError({ action: 'SOME_ACTION' });
			await failureLogger()(e);
			expect(logger.error.mock.calls).toHaveLength(1);
			const loggedError = logger.error.mock.calls[0][0];
			expect(loggedError.stack).toBeUndefined();
			expect(loggedError).toMatchSnapshot();
		});

		it('fetch response error', async () => {
			const headers = new Headers();
			headers.append('content-type', 'application/json; charset=utf-8');
			const e = new Response(JSON.stringify({ message: 'test' }), {
				status: 500,
				headers,
			});
			e.action = 'SOME_ACTION';
			await failureLogger()(e);
			expect(logger.error.mock.calls).toHaveLength(1);
			const loggedError = logger.error.mock.calls[0][0];
			expect(loggedError.stack).toBeUndefined();
			expect(loggedError).toMatchSnapshot();
		});

		it('plain object', async () => {
			const e = { action: 'SOME_ACTION' };
			await failureLogger()(e);
			expect(logger.error.mock.calls).toHaveLength(1);
			const loggedError = logger.error.mock.calls[0][0];
			expect(loggedError.stack).toBeUndefined();
			expect(loggedError).toMatchSnapshot();
		});
	});

	describe('override category in', () => {
		it('plain object', async () => {
			const e = {
				status: 500,
				message: 'some message to describe the case',
				category: CATEGORIES.FETCH_RESPONSE_ERROR,
			};
			await failureLogger()(e);
			expect(logger.error.mock.calls[0][0]).toHaveProperty(
				'category',
				CATEGORIES.FETCH_RESPONSE_ERROR,
			);
		});

		it('nError', async () => {
			const e = nError({
				category: CATEGORIES.FETCH_RESPONSE_ERROR,
			});
			await failureLogger()(e);
			expect(logger.error.mock.calls[0][0]).toHaveProperty(
				'category',
				CATEGORIES.FETCH_RESPONSE_ERROR,
			);
		});

		it('ExtendedError if it has .category', async () => {
			const e = nError({
				category: CATEGORIES.FETCH_RESPONSE_ERROR,
			});
			await failureLogger()(e);
			expect(logger.error.mock.calls[0][0]).toHaveProperty(
				'category',
				CATEGORIES.FETCH_RESPONSE_ERROR,
			);
		});
	});
});
