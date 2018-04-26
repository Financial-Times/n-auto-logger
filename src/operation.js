import { createEnhancer } from '@financial-times/n-express-enhancer';

import loggerEvent from './event';

export const logOperation = operationFunction => async (meta, req, res) => {
	const operation = operationFunction.name;
	const m = {
		operation,
		...(req && req.meta ? req.meta : {}),
		...meta,
	};
	const event = loggerEvent(m);

	try {
		await operationFunction(m, req, res);
		event.success();
	} catch (e) {
		event.failure(e);
		throw e;
	}
};

export default createEnhancer(logOperation);
