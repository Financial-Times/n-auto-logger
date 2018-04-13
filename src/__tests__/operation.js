import express from 'express';
import request from 'supertest';
import compose from 'compose-function';

import logger, { autoLogAction } from '../index';
import {
	autoLogOp,
	autoLogOps,
	toMiddleware,
	toMiddlewares,
} from '../operation';

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

/*
	compatibility test with n-auto-metrics
	https://github.com/Financial-Times/n-auto-metrics/blob/master/src/__tests__/operation.js
 */

describe('autoLogOp', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('returns a valid operation function', () => {
		it('with the original funciton name', () => {
			const operationFunction = () => {};
			const enhanced = autoLogOp(operationFunction);
			expect(enhanced.name).toBe(operationFunction.name);
		});

		it('the standard argument length', () => {
			const operationFunction = () => {};
			const enhanced = autoLogOp(operationFunction);
			expect(enhanced).toHaveLength(3);
		});

		it('executes correctly', () => {
			const callFunction = jest.fn();
			const operationFunction = () => {
				callFunction();
			};
			const enhanced = autoLogOp(operationFunction);
			enhanced();
			expect(callFunction.mock.calls).toHaveLength(1);
			enhanced();
			expect(callFunction.mock.calls).toHaveLength(2);
		});

		it('throws error correctly', async () => {
			const operationFunction = errorOperationFunction;
			const enhanced = autoLogOp(operationFunction);
			try {
				await enhanced();
			} catch (e) {
				expect(e).toBe(commonErrorInstance);
			}
		});
	});

	describe('logs operation correctly with autoLogAction when', () => {
		describe('success of', () => {
			it('async function with async sub actions', async () => {
				const callFunction = () => Promise.resolve('foo');
				const operationFunction = async meta => {
					await autoLogAction(callFunction)(null, meta);
				};
				const enhanced = autoLogOp(operationFunction);
				await enhanced();
				expect(logger.info.mock.calls).toMatchSnapshot();
			});

			it('non-async function with non async sub actions', async () => {
				const callFunction = () => {};
				const operationFunction = meta => {
					autoLogAction(callFunction)(null, meta);
				};
				const enhanced = autoLogOp(operationFunction);
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
						autoLogAction(callFunction)(null, meta);
					} catch (e) {
						throw e;
					}
				};
				const enhanced = autoLogOp(operationFunction);
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
						await autoLogAction(callFunction)(null, meta);
					} catch (e) {
						throw e;
					}
				};
				const enhanced = autoLogOp(operationFunction);
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

describe('toMiddleware', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('converts operation function to a valid express middleware when input', () => {
		it('non-async function', async () => {
			const operationFunction = (meta, req, res) => {
				res.status(200).send(meta);
			};
			const middleware = compose(toMiddleware, autoLogOp)(operationFunction);
			const app = express();
			app.use('/', middleware);
			const res = await request(app).get('/');
			expect(res.statusCode).toBe(200);
			expect(res.body).toEqual({ operation: 'operationFunction' });
		});

		it('async function', async () => {
			const operationFunction = async (meta, req, res) => {
				res.status(200).send(meta);
			};
			const middleware = compose(toMiddleware, autoLogOp)(operationFunction);
			const app = express();
			app.use('/', middleware);
			const res = await request(app).get('/');
			expect(res.statusCode).toBe(200);
			expect(res.body).toEqual({ operation: 'operationFunction' });
		});

		it('controller kind function set res.rendered', async () => {
			const operationFunction = (meta, req, res) => {
				res.rendered = true;
			};
			const middleware = compose(toMiddleware, autoLogOp)(operationFunction);
			const next = jest.fn();
			await middleware({}, {}, next);
			expect(next.mock.calls).toHaveLength(0);
		});
	});

	describe('handle the thrown error correctly of', () => {
		it('non-async function not calling res', async () => {
			const operationFunction = () => {
				throw commonErrorInstance;
			};
			const middleware = compose(toMiddleware, autoLogOp)(operationFunction);
			const res = { headersSent: false };
			const next = jest.fn();
			await middleware(null, res, next);
			expect(next.mock.calls).toMatchSnapshot();
			const app = express();
			app.use('/', middleware, commonErrorHandler);
			const response = await request(app).get('/');
			expect(response.statusCode).toBe(404);
			expect(response.body.message).toBe('Not Found');
		});

		it('non-async function calling res', async () => {
			const operationFunction = (meta, req, res) => {
				try {
					throw commonErrorInstance;
				} catch (e) {
					res.status(500).send('internal server error');
				}
			};
			const middleware = compose(toMiddleware, autoLogOp)(operationFunction);
			const res = {
				status: () => {},
				send: () => {},
				headersSent: true,
			};
			const next = jest.fn();
			await middleware(null, res, next);
			expect(next.mock.calls).toHaveLength(0);
			const app = express();
			app.use('/', middleware, commonErrorHandler);
			const response = await request(app).get('/');
			expect(response.statusCode).toBe(500);
			expect(response.text).toBe('internal server error');
		});

		it('async function not calling res', async () => {
			const operationFunction = async () => {
				throw commonErrorInstance;
			};
			const middleware = compose(toMiddleware, autoLogOp)(operationFunction);
			const res = { headersSent: false };
			const next = jest.fn();
			await middleware(null, res, next);
			expect(next.mock.calls).toMatchSnapshot();
			const app = express();
			app.use('/', middleware, commonErrorHandler);
			const response = await request(app).get('/');
			expect(response.statusCode).toBe(404);
			expect(response.body.message).toBe('Not Found');
		});

		it('async function calling res', async () => {
			const operationFunction = async (meta, req, res) => {
				try {
					throw commonErrorInstance;
				} catch (e) {
					res.status(500).send('internal server error');
				}
			};
			const middleware = compose(toMiddleware, autoLogOp)(operationFunction);
			const res = {
				status: () => {},
				send: () => {},
				headersSent: true,
			};
			const next = jest.fn();
			await middleware(null, res, next);
			expect(next.mock.calls).toHaveLength(0);
			const app = express();
			app.use('/', middleware, commonErrorHandler);
			const response = await request(app).get('/');
			expect(response.statusCode).toBe(500);
			expect(response.text).toBe('internal server error');
		});
	});

	describe('triggers autoLogOp enhanced operation function correctly of', () => {
		describe('success', () => {
			it('async function with async sub actions', async () => {
				const callFunction = () => Promise.resolve('foo');
				const operationFunction = async meta => {
					await autoLogAction(callFunction)(null, meta);
				};
				const middleware = compose(toMiddleware, autoLogOp)(operationFunction);
				const app = express();
				app.use('/', middleware);
				await request(app).get('/');
				expect(logger.info.mock.calls).toMatchSnapshot();
			});

			it('non-async function with non-async sub actions', async () => {
				const callFunction = () => {};
				const operationFunction = meta => {
					autoLogAction(callFunction)(null, meta);
				};
				const middleware = compose(toMiddleware, autoLogOp)(operationFunction);
				const app = express();
				app.use('/', middleware);
				await request(app).get('/');
				expect(logger.info.mock.calls).toMatchSnapshot();
			});
		});

		describe('failure of', () => {
			it('non-async function', async () => {
				const errorInstance = {
					status: 500,
					message: 'foo',
					category: 'CUSTOM_ERROR',
				};
				const callFunction = () => {
					throw errorInstance;
				};
				const operationFunction = meta => {
					try {
						autoLogAction(callFunction)(null, meta);
					} catch (e) {
						throw e;
					}
				};
				const middleware = compose(toMiddleware, autoLogOp)(operationFunction);
				const app = express();
				app.use('/', middleware);
				await request(app).get('/');
				expect(logger.info.mock.calls).toMatchSnapshot();
				expect(logger.warn.mock.calls).toMatchSnapshot();
				expect(logger.error.mock.calls).toMatchSnapshot();
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
				const operationFunction = async meta => {
					try {
						await autoLogAction(callFunction)(null, meta);
					} catch (e) {
						throw e;
					}
				};
				const middleware = compose(toMiddleware, autoLogOp)(operationFunction);
				const app = express();
				app.use('/', middleware);
				await request(app).get('/');
				expect(logger.info.mock.calls).toMatchSnapshot();
				expect(logger.warn.mock.calls).toMatchSnapshot();
				expect(logger.error.mock.calls).toMatchSnapshot();
			});
		});
	});
});

describe('autoLogOp and toMiddleware', () => {
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
		const middleware = compose(toMiddleware, autoLogOp)(operationFunction);
		const app = express();
		app.use('/', metaMiddleware, middleware);
		const res = await request(app).get('/');
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchSnapshot();
		expect(logger.info.mock.calls).toMatchSnapshot();
	});
});

describe('autoLogOps', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('decorate each method correctly', async () => {
		const operationFunctionA = () => {};
		const operationFunctionB = () => {};
		const enhanced = autoLogOps({
			operationFunctionA,
			operationFunctionB,
		});
		expect(enhanced.operationFunctionA.name).toBe('operationFunctionA');
		expect(enhanced.operationFunctionB.name).toBe('operationFunctionB');
		await enhanced.operationFunctionA();
		await enhanced.operationFunctionB();
		expect(logger.info.mock.calls).toMatchSnapshot();
	});

	it('set anonymous function names as per property name correctly', async () => {
		const createOperationFunction = () => () => {};
		const operationFunctionA = createOperationFunction();
		const operationFunctionB = createOperationFunction();
		const enhanced = autoLogOps({
			operationFunctionA,
			operationFunctionB,
		});
		expect(enhanced.operationFunctionA.name).toBe('operationFunctionA');
		expect(enhanced.operationFunctionB.name).toBe('operationFunctionB');
		await enhanced.operationFunctionA();
		await enhanced.operationFunctionB();
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
		const enhancedController = compose(toMiddlewares, autoLogOps)({
			operationFunctionA,
			operationFunctionB,
		});
		expect(enhancedController.operationFunctionA.name).toBe(
			'operationFunctionA',
		);
		expect(enhancedController.operationFunctionB.name).toBe(
			'operationFunctionB',
		);
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

	it('set anonymous function names as per property name correctly', async () => {
		const createOperationFunction = () => (meta, req, res) => {
			res.status(200).send(meta);
		};
		const operationFunctionA = createOperationFunction();
		const operationFunctionB = createOperationFunction();
		const enhancedController = compose(toMiddlewares, autoLogOps)({
			operationFunctionA,
			operationFunctionB,
		});
		expect(enhancedController.operationFunctionA.name).toBe(
			'operationFunctionA',
		);
		expect(enhancedController.operationFunctionB.name).toBe(
			'operationFunctionB',
		);
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

	describe('log serial middleware in correct order for', () => {
		it('non-async functions success', async () => {
			const operationFunctionA = () => {};
			const operationFunctionB = () => {};
			const operationFunctionC = (meta, req, res) => {
				res.status(200).send(meta);
			};
			const enhanced = compose(toMiddlewares, autoLogOps)({
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
			const enhanced = compose(toMiddlewares, autoLogOps)({
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
