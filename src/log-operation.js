import { createEnhancer } from '@financial-times/n-express-enhancer';

import createEventLogger from './event-logger';
import { LOG_LEVELS } from './constants';

export const logOperation = operationFunction => async (meta, req, res) => {
	const operation = operationFunction.name;
	const m = {
		operation,
		...(req && req.meta ? req.meta : {}),
		...meta,
	};
	const event = createEventLogger(m);
	const { AUTO_LOG_LEVEL = LOG_LEVELS.verbose } = process.env;
	if (AUTO_LOG_LEVEL === LOG_LEVELS.verbose) event.start();

	try {
		await operationFunction(m, req, res);
		if (AUTO_LOG_LEVEL !== LOG_LEVELS.error) event.success();
	} catch (e) {
		event.failure(e);
		throw e;
	}
};

export default createEnhancer(logOperation);
