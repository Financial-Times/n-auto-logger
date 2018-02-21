import logger from '@financial-times/n-logger';
import nError from '@financial-times/n-error';
import { Response, Headers, FetchError } from 'node-fetch';

import failureLogger from '../failure';
import { CATEGORIES } from '../constants';
import { assertErrorLog } from '../utils';

jest.mock('@financial-times/n-logger');

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
			expect(logger.warn.mock.calls).toHaveLength(1);
			expect(logger.error.mock.calls).toHaveLength(1);
			assertErrorLog(logger.warn.mock.calls[0][0]);
		});

		it('fetch network error', async () => {
			const e = new FetchError(
				'request to https://unknown/ failed, reason: getaddrinfo ENOTFOUND unknown unknown:443',
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

		it('extended Error with status', async () => {
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
			assertErrorLog(logger.error.mock.calls[0][0]);
		});

		// TODO: consolidate this into nError
		it('extended Error with empty fields', async () => {
			class ExtendedError extends Error {
				constructor({ test } = {}) {
					super();
					this.test = test;
				}
			}
			const extendedSystemError = new ExtendedError({});
			await failureLogger()(extendedSystemError);
			const loggedError = logger.error.mock.calls[0][0];
			expect(loggedError.category).toBe(CATEGORIES.CUSTOM_ERROR);
			expect(loggedError.test).toBeUndefined();
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

	describe('hides user field in', () => {
		it('extended Error', async () => {
			const extendedSystemError = nError({
				user: {
					message: 'some message',
					email: 'some email address',
				},
			});
			await failureLogger()(extendedSystemError);
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

		it('extended Error', async () => {
			const extendedSystemError = nError({
				category: CATEGORIES.FETCH_RESPONSE_ERROR,
			});
			await failureLogger()(extendedSystemError);
			expect(logger.error.mock.calls[0][0]).toHaveProperty(
				'category',
				CATEGORIES.FETCH_RESPONSE_ERROR,
			);
		});
	});
});
