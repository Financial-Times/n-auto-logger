import express from 'express';
import request from 'supertest';
import compose from 'compose-function';

import logger, { logAction, toMiddleware } from '../index';
import logOperation from '../operation';

jest.mock('@financial-times/n-logger');

/* eslint-disable no-unused-vars */
const commonErrorHandler = (err, req, res, next) => {
	res.status(err.status).send(err);
};
/* eslint-enable no-unused-vars */
const commonErrorInstance = { status: 404, message: 'Not Found' };
const errorOperationFunction = () => {
	throw commonErrorInstance;
};

describe('logOperation', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('returns a valid operation function', () => {
		it('the standard argument length', () => {
			const operationFunction = () => {};
			const enhanced = logOperation(operationFunction);
			expect(enhanced).toHaveLength(3);
		});

		it('throws error correctly', async () => {
			const operationFunction = errorOperationFunction;
			const enhanced = logOperation(operationFunction);
			try {
				await enhanced();
			} catch (e) {
				expect(e).toBe(commonErrorInstance);
			}
		});
	});

	describe('logs operation correctly combined with logAction when', () => {
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
			it('non-async function', async () => {
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

			it('async function', async () => {
				const callFunction = () => {
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
	});
});

describe('logOperation and toMiddleware', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('logs meta from previous middleware correctly', async () => {
		const metaMiddleware = (req, res, next) => {
			req.meta = {
				...req.meta,
				transactionId: 'xxxx-xxxx',
			};
			next();
		};
		const operationFunction = async (meta, req, res) => {
			res.status(200).send(meta);
		};
		const middleware = compose(toMiddleware, logOperation)(operationFunction);
		const app = express();
		app.use('/', metaMiddleware, middleware);
		const res = await request(app).get('/');
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchSnapshot();
		expect(logger.info.mock.calls).toMatchSnapshot();
	});

	describe('log serial middleware in correct order for', () => {
		it('non-async functions success', async () => {
			const operationFunctionA = () => {};
			const operationFunctionB = () => {};
			const operationFunctionC = (meta, req, res) => {
				res.status(200).send(meta);
			};
			const enhanced = compose(toMiddleware, logOperation)({
				operationFunctionA,
				operationFunctionB,
				operationFunctionC,
			});
			const app = express();
			app.use(
				'/',
				enhanced.operationFunctionA,
				enhanced.operationFunctionB,
				enhanced.operationFunctionC,
			);
			const res = await request(app).get('/');
			expect(res.statusCode).toBe(200);
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('non-async function failure', async () => {
			const operationFunctionA = () => {};
			const operationFunctionB = errorOperationFunction;
			const operationFunctionC = (req, res) => {
				res.status(200).send('hello world');
			};
			const enhanced = compose(toMiddleware, logOperation)({
				operationFunctionA,
				operationFunctionB,
				operationFunctionC,
			});
			const app = express();
			app.use(
				'/',
				enhanced.operationFunctionA,
				enhanced.operationFunctionB,
				enhanced.operationFunctionC,
			);
			const res = await request(app).get('/');
			expect(res.statusCode).toBe(404);
			expect(logger.info.mock.calls).toMatchSnapshot();
			expect(logger.warn.mock.calls).toMatchSnapshot();
		});
	});
});
