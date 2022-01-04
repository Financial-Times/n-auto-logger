import { createEnhancer, isPromise } from '@financial-times/n-express-enhancer';

import createEventLogger from './event-logger';
import { LOG_LEVELS } from './constants';

const logAction = actionFunction => (param = {}, meta = {}, ...excessive) => {
	if (
		excessive.length ||
		typeof param !== 'object' ||
		typeof meta !== 'object'
	) {
		throw Error(
			`invalid input for action function [${
				actionFunction.name
			}] following signature standard of (param: Object, meta?: Object)`,
		);
	}

	const { AUTO_LOG_LEVEL = LOG_LEVELS.standard } = process.env;

	const event = createEventLogger({
		...meta,
		action: actionFunction.name,
		...(AUTO_LOG_LEVEL === LOG_LEVELS.concise ? {} : param),
	});

	if (AUTO_LOG_LEVEL === LOG_LEVELS.verbose) event.start();

	try {
		const call = actionFunction(param, meta);

		if (isPromise(call)) {
			return call
				.then(data => {
					if (
						[LOG_LEVELS.verbose, LOG_LEVELS.standard].includes(AUTO_LOG_LEVEL)
					)
						event.success();
					return data;
				})
				.catch(e => {
					if (
						[LOG_LEVELS.verbose, LOG_LEVELS.standard].includes(AUTO_LOG_LEVEL)
					)
						event.failure(e);
					throw e;
				});
		}

		const data = call;
		if ([LOG_LEVELS.verbose, LOG_LEVELS.standard].includes(AUTO_LOG_LEVEL))
			event.success();
		return data;
	} catch (e) {
		if ([LOG_LEVELS.verbose, LOG_LEVELS.standard].includes(AUTO_LOG_LEVEL))
			event.failure(e);
		throw e;
	}
};

export default createEnhancer(logAction);
