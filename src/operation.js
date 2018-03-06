import loggerEvent from './event';

export const autoLogOp = operationFunction => async (req, res, next) => {
	const meta = {
		operation: operationFunction.name,
		...(req && Object.prototype.hasOwnProperty.call(req, 'meta')
			? req.meta
			: {}),
	};
	const event = loggerEvent(meta);

	try {
		await operationFunction(meta, req, res, next);
		event.success();
	} catch (e) {
		event.failure(e);
	}
};

export const autoLogOps = operationFunctionBundle => {
	const enhanced = {};
	Object.keys(operationFunctionBundle).forEach(methodName => {
		enhanced[methodName] = autoLogOp(operationFunctionBundle[methodName]);
	});
	return enhanced;
};
