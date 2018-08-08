import { isPromise } from '@financial-times/n-express-enhancer';

import createEventLogger from './event-logger';
import { LOG_LEVELS } from './constants';

const logAction = actionFunction => (paramsOrArgs, meta, ...excessive) => {
	if (
		excessive.length ||
		(paramsOrArgs !== undefined && typeof paramsOrArgs !== 'object') ||
		(meta !== undefined && typeof meta !== 'object')
	) {
		throw Error(
			`input args of autoLogged function [${
				actionFunction.name
			}] needs to (params: Object, meta?: Object)`,
		);
	}

	const { meta: metaInArgs, ...params } = paramsOrArgs || {};

	const event = createEventLogger({
		...meta,
		...metaInArgs,
		action: actionFunction.name,
		...params,
	});
	const { AUTO_LOG_LEVEL = LOG_LEVELS.verbose } = process.env;

	if (AUTO_LOG_LEVEL === LOG_LEVELS.verbose) event.start();

	try {
		const call = meta
			? actionFunction(paramsOrArgs, meta)
			: actionFunction(paramsOrArgs);

		if (isPromise(call)) {
			return call
				.then(data => {
					if (AUTO_LOG_LEVEL === LOG_LEVELS.verbose) event.success();
					return data;
				})
				.catch(e => {
					if (AUTO_LOG_LEVEL !== LOG_LEVELS.error) event.failure(e);
					throw e;
				});
		}

		const data = call;
		if (AUTO_LOG_LEVEL === LOG_LEVELS.verbose) event.success();
		return data;
	} catch (e) {
		if (AUTO_LOG_LEVEL !== LOG_LEVELS.error) event.failure(e);
		throw e;
	}
};

export default logAction;
