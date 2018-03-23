import loggerEvent from './event';
import { isPromise } from './utils';

export const autoLogAction = callFunction => {
	const enhancedFunction = (paramsOrArgs, meta, ...excessive) => {
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
	Object.defineProperty(enhancedFunction, 'name', {
		value: callFunction.name,
		configurable: true,
	});
	return enhancedFunction;
};

export const autoLogActions = helperStandardService => {
	const enhanced = {};
	Object.keys(helperStandardService).forEach(methodName => {
		const enhancedMethod = (paramsOrArgs, meta) =>
			autoLogAction(helperStandardService[methodName])(paramsOrArgs, meta);
		// ensure the methodName passed to autoLogAction if it is created by function creator or anonymously
		Object.defineProperty(helperStandardService[methodName], 'name', {
			value: methodName,
			configurable: true,
		});
		// ensure name appended to be read for other individual enhancer that doesn't access object[methodName]
		Object.defineProperty(enhancedMethod, 'name', {
			value: methodName,
			configurable: true,
		});
		enhanced[methodName] = enhancedMethod;
	});
	return enhanced;
};
