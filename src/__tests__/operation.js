import express from 'express';
import request from 'supertest';

import logger, { autoLogAction } from '../index';
import { autoLogOperation, autoLogController } from '../operation';

jest.mock('@financial-times/n-logger');

describe('autoLogOperation', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('returns a valid express middleware', () => {
		it('for non-async function', async () => {
			const operationFunction = (meta, req, res) => {
				res.status(200).send(meta);
			};
			const middleware = autoLogOperation(operationFunction);
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
			const middleware = autoLogOperation(operationFunction);
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
			/* eslint-disable no-unused-vars */
			const errorHanlder = (err, req, res, next) => {
				res.status(err.status).send(err);
			};
			/* eslint-enable no-unused-vars */
			const middleware = autoLogOperation(operationFunction);
			const app = express();
			app.use('/', middleware, errorHanlder);
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
			/* eslint-disable no-unused-vars */
			const errorHanlder = (err, req, res, next) => {
				res.status(err.status).send(err);
			};
			/* eslint-enable no-unused-vars */
			const middleware = autoLogOperation(operationFunction);
			const app = express();
			app.use('/', middleware, errorHanlder);
			const res = await request(app).get('/');
			expect(res.statusCode).toBe(404);
			expect(res.body.message).toBe('Not Found');
		});
	});

	describe('logs correctly', () => {
		it('operatoin success with operationFunction name and sub actions', async () => {
			const callFunction = () => Promise.resolve('foo');
			const operationFunction = async meta => {
				await autoLogAction(callFunction)(null, meta);
			};
			await autoLogOperation(operationFunction)();
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('operation failure of non-async function', () => {
			const callFunction = () => {
				const e = { status: 500, message: 'foo' };
				throw e;
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
			autoLogOperation(operationFunction)(null, null, next);
			expect(logger.info.mock.calls).toMatchSnapshot();
			expect(logger.error.mock.calls).toMatchSnapshot();
			expect(next.mock.calls).toMatchSnapshot();
		});

		it('operation failure of async function', async () => {
			const callFunction = () => {
				const e = { status: 500, message: 'foo' };
				throw e;
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
			await autoLogOperation(operationFunction)(null, null, next);
			expect(logger.info.mock.calls).toMatchSnapshot();
			expect(logger.error.mock.calls).toMatchSnapshot();
			expect(next.mock.calls).toMatchSnapshot();
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
			const operationMiddleware = autoLogOperation(operationFunction);
			const app = express();
			app.use('/', metaMiddleware, operationMiddleware);
			const res = await request(app).get('/');
			expect(res.statusCode).toBe(200);
			expect(res.body).toMatchSnapshot();
			expect(logger.info.mock.calls).toMatchSnapshot();
		});
	});
});

describe('autoLogController', () => {
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
		const enhancedController = autoLogController({
			operationFunctionA,
			operationFunctionB,
		});
		const app = express();
		app.use('/a', enhancedController.operationFunctionA);
		app.use('/b', enhancedController.operationFunctionB);
		const resA = await request(app).get('/a');
		expect(resA.statusCode).toBe(200);
		expect(resA.body).toMatchSnapshot();
		expect(logger.info.mock.calls).toMatchSnapshot();
		const resB = await request(app).get('/b');
		expect(resB.statusCode).toBe(200);
		expect(resB.body).toMatchSnapshot();
	});
});
