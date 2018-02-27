import loggerEvent from './event';

export const autoLogOperation = operationFunction => async (req, res, next) => {
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
		next(e);
	}
};

export default {
	autoLogOperation,
};
