import loggerEvent from './event';
import { isPromise } from './utils';

export const autoLogOp = operationFunction => (req, res, next) => {
	const meta = {
		operation: operationFunction.name,
		...(req && Object.prototype.hasOwnProperty.call(req, 'meta')
			? req.meta
			: {}),
	};
	const event = loggerEvent(meta);

	try {
		const call = operationFunction(meta, req, res, next);
		if (isPromise(call)) {
			return call.then(() => event.success()).catch(e => event.failure(e));
		}
		return event.success();
	} catch (e) {
		return event.failure(e);
	}
};

export const autoLogOps = operationFunctionBundle => {
	const enhanced = {};
	Object.keys(operationFunctionBundle).forEach(methodName => {
		enhanced[methodName] = autoLogOp(operationFunctionBundle[methodName]);
	});
	return enhanced;
};
