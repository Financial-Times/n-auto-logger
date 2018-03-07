import loggerEvent from './event';
import { isPromise } from './utils';

export const autoLogAction = callFunction => (
	paramsOrArgs,
	meta,
	...excessive
) => {
	if (
		excessive.length ||
		(paramsOrArgs !== undefined && typeof paramsOrArgs !== 'object') ||
		(meta !== undefined && typeof meta !== 'object')
	) {
		throw Error(
			`input args of autoLogged function [${
				callFunction.name
			}] needs to (params: Object, meta?: Object)`,
		);
	}

	const event = loggerEvent({
		...meta,
		action: callFunction.name,
		...paramsOrArgs,
	});

	try {
		const call = callFunction(paramsOrArgs, meta);
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

export const autoLogActions = helperStandardService => {
	const enhanced = {};
	Object.keys(helperStandardService).forEach(methodName => {
		enhanced[methodName] = (paramsOrArgs, meta) =>
			autoLogAction(helperStandardService[methodName])(paramsOrArgs, meta);
	});
	return enhanced;
};
