import { createEnhancer } from '@financial-times/n-express-enhancer';

import loggerEvent from './event';
import { isPromise } from './utils';

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

	const event = loggerEvent({
		...meta,
		action: actionFunction.name,
		...paramsOrArgs,
	});

	try {
		const call = actionFunction(paramsOrArgs, meta);
		if (isPromise(call)) {
			return call
				.then(data => {
					event.success();
					return data;
				})
				.catch(e => {
					event.failure(e);
					throw e;
				});
		}
		const data = call;
		event.success();
		return data;
	} catch (e) {
		event.failure(e);
		throw e;
	}
};

export default createEnhancer(logAction);
