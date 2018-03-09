import express from 'express';
import request from 'supertest';

import logger, { autoLogAction } from '../index';
import {
	autoLogOp,
	autoLogOps,
	autoLogOpToMiddleware,
	autoLogOpsToMiddlewares,
} from '../operation';

jest.mock('@financial-times/n-logger');

/* eslint-disable no-unused-vars */
const commonErrorHandler = (err, req, res, next) => {
	res.status(err.status).send(err);
};
/* eslint-enable no-unused-vars */

/*
	compatibility test with n-auto-metrics
	https://github.com/Financial-Times/n-auto-metrics/blob/master/src/__tests__/operation.js
 */

describe('autoLogOp and toMiddleware', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('returns a valid express middleware', () => {
		it('for non-async function', async () => {
			const operationFunction = (meta, req, res) => {
				res.status(200).send(meta);
			};
			const middleware = autoLogOpToMiddleware(operationFunction);
			const app = express();
			app.use('/', middleware);
			const res = await request(app).get('/');
			expect(res.statusCode).toBe(200);
			expect(res.body).toEqual({ operation: 'operationFunction' });
		});

		it('for async function', async () => {
			const operationFunction = async (meta, req, res) => {
				res.status(200).send(meta);
			};
			const middleware = autoLogOpToMiddleware(operationFunction);
			const app = express();
			app.use('/', middleware);
			const res = await request(app).get('/');
			expect(res.statusCode).toBe(200);
			expect(res.body).toEqual({ operation: 'operationFunction' });
		});

		it('for non-async function throwing error', async () => {
			const operationFunction = (meta, req, res, next) => {
				const e = { status: 404, message: 'Not Found' };
				next(e);
				throw e;
			};
			const middleware = autoLogOpToMiddleware(operationFunction);
			const app = express();
			app.use('/', middleware, commonErrorHandler);
			const res = await request(app).get('/');
			expect(res.statusCode).toBe(404);
			expect(res.body.message).toBe('Not Found');
		});

		it('for async function throwing error', async () => {
			const operationFunction = async (meta, req, res, next) => {
				const e = { status: 404, message: 'Not Found' };
				next(e);
				throw e;
			};
			const middleware = autoLogOpToMiddleware(operationFunction);
			const app = express();
			app.use('/', middleware, commonErrorHandler);
			const res = await request(app).get('/');
			expect(res.statusCode).toBe(404);
			expect(res.body.message).toBe('Not Found');
		});
	});

	describe('logs correctly', () => {
		describe('operation success of', () => {
			it('async function with async sub actions', async () => {
				const callFunction = () => Promise.resolve('foo');
				const operationFunction = async meta => {
					await autoLogAction(callFunction)(null, meta);
				};
				const middleware = autoLogOpToMiddleware(operationFunction);
				await middleware();
				expect(logger.info.mock.calls).toMatchSnapshot();
			});

			it('non-async function with non async sub actions', async () => {
				const callFunction = () => {};
				const operationFunction = meta => {
					autoLogAction(callFunction)(null, meta);
				};
				const middleware = autoLogOpToMiddleware(operationFunction);
				await middleware();
				expect(logger.info.mock.calls).toMatchSnapshot();
			});

			it('req.meta from previous middlewares', async () => {
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
				const middleware = autoLogOpToMiddleware(operationFunction);
				const app = express();
				app.use('/', metaMiddleware, middleware);
				const res = await request(app).get('/');
				expect(res.statusCode).toBe(200);
				expect(res.body).toMatchSnapshot();
				expect(logger.info.mock.calls).toMatchSnapshot();
			});
		});

		describe('operation failure of', () => {
			it('non-async function', async () => {
				const errorInstance = {
					status: 500,
					message: 'foo',
					category: 'CUSTOM_ERROR',
				};
				const callFunction = () => {
					throw errorInstance;
				};
				const operationFunction = (meta, req, res, next) => {
					try {
						autoLogAction(callFunction)(null, meta);
					} catch (e) {
						next(e);
						throw e;
					}
				};
				const next = jest.fn();
				try {
					await autoLogOp(operationFunction)(null, null, null, next);
				} catch (e) {
					expect(e).toBe(errorInstance);
					expect(logger.info.mock.calls).toMatchSnapshot();
					expect(logger.error.mock.calls).toMatchSnapshot();
					expect(next.mock.calls).toMatchSnapshot();
				}
			});

			it('async function', async () => {
				const errorInstance = {
					status: 500,
					message: 'foo',
					category: 'CUSTOM_ERROR',
				};
				const callFunction = () => {
					throw errorInstance;
				};
				const operationFunction = async (meta, req, res, next) => {
					try {
						await autoLogAction(callFunction)(null, meta);
					} catch (e) {
						next(e);
						throw e;
					}
				};
				const next = jest.fn();
				try {
					await autoLogOp(operationFunction)(null, null, null, next);
				} catch (e) {
					expect(e).toBe(errorInstance);
					expect(logger.info.mock.calls).toMatchSnapshot();
					expect(logger.error.mock.calls).toMatchSnapshot();
					expect(next.mock.calls).toMatchSnapshot();
				}
			});
		});
	});
});

describe('autoLogOps', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('decorate each method correctly', async () => {
		const operationFunctionA = (meta, req, res, next) => {
			next(meta);
		};
		const operationFunctionB = (meta, req, res, next) => {
			next(meta);
		};
		const enhancedOperations = autoLogOps({
			operationFunctionA,
			operationFunctionB,
		});
		const next = jest.fn();
		await enhancedOperations.operationFunctionA(null, null, null, next);
		await enhancedOperations.operationFunctionB(null, null, null, next);
		expect(logger.info.mock.calls).toMatchSnapshot();
	});
});

describe('autoLogOpsToMiddlewares', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('decorate each method correctly', async () => {
		const operationFunctionA = (meta, req, res) => {
			res.status(200).send(meta);
		};
		const operationFunctionB = (meta, req, res) => {
			res.status(200).send(meta);
		};
		const enhancedController = autoLogOpsToMiddlewares({
			operationFunctionA,
			operationFunctionB,
		});
		const app = express();
		app.use('/a', enhancedController.operationFunctionA);
		app.use('/b', enhancedController.operationFunctionB);
		const resA = await request(app).get('/a');
		expect(resA.statusCode).toBe(200);
		expect(resA.body).toMatchSnapshot();
		const resB = await request(app).get('/b');
		expect(resB.statusCode).toBe(200);
		expect(resB.body).toMatchSnapshot();
		expect(logger.info.mock.calls).toMatchSnapshot();
	});
});
