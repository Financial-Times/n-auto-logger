import { createEnhancer } from '@financial-times/n-express-enhancer';

import createEventLogger from './event-logger';
import { LOG_LEVELS } from './constants';

export const logOperation = operationFunction => async (req = {}, res = {}) => {
	const operation = operationFunction.name;
	const meta = {
		...req.meta,
		operation,
	};
	const { AUTO_LOG_LEVEL = LOG_LEVELS.verbose } = process.env;

	const event = createEventLogger(meta);

	if (AUTO_LOG_LEVEL === LOG_LEVELS.verbose) event.start();

	try {
		req.meta = meta;
		await operationFunction(req, res);
		if (AUTO_LOG_LEVEL !== LOG_LEVELS.error) event.success();
	} catch (e) {
		event.failure(e);
		throw e;
	}
};

export default createEnhancer(logOperation);
