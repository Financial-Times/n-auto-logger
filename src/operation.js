import loggerEvent from './event';

export const autoLogOp = operationFunction => {
	const enhancedFunction = async (meta, req, res, next) => {
		const operation = operationFunction.name;
		const m = {
			operation,
			...(req && Object.prototype.hasOwnProperty.call(req, 'meta')
				? req.meta
				: {}),
			...meta,
		};
		const event = loggerEvent(m);

		try {
			await operationFunction(m, req, res, next);
			event.success();
		} catch (e) {
			event.failure(e);
			throw e;
		}
	};
	Object.defineProperty(enhancedFunction, 'name', {
		value: operationFunction.name,
		configurable: true,
	});
	return enhancedFunction;
};

export const toMiddleware = operationFunction => {
	const convertedFunction = async (req, res, next) => {
		try {
			await operationFunction({}, req, res, next);
		} catch (e) {
			// do nothing
		}
	};
	Object.defineProperty(convertedFunction, 'name', {
		value: operationFunction.name,
		configurable: true,
	});
	return convertedFunction;
};

export const autoLogOps = operationBundle => {
	const enhanced = {};
	Object.keys(operationBundle).forEach(methodName => {
		const enhancedMethod = autoLogOp(operationBundle[methodName]);
		Object.defineProperty(enhancedMethod, 'name', {
			value: methodName,
			configurable: true,
		});
		enhanced[methodName] = enhancedMethod;
	});
	return enhanced;
};

export const toMiddlewares = operationBundle => {
	const converted = {};
	Object.keys(operationBundle).forEach(methodName => {
		const convertedMethod = toMiddleware(operationBundle[methodName]);
		Object.defineProperty(operationBundle[methodName], 'name', {
			value: methodName,
			configurable: true,
		});
		Object.defineProperty(convertedMethod, 'name', {
			value: methodName,
			configurable: true,
		});
		converted[methodName] = convertedMethod;
	});
	return converted;
};
