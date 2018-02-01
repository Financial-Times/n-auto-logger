import logger from '@financial-times/n-logger';
import {
	trimObject,
	removeObjectKeys,
	fieldStringToArray,
	isPromise,
} from './utils';
import failureLogger from './failure';

// TODO: support trim nested object leaves?
// N-LOGGER would flatten nested object and logout their leave values
const createEventLogger = context => {
	const { LOGGER_MUTE_FIELDS } = process.env;
	const event = LOGGER_MUTE_FIELDS
		? removeObjectKeys(trimObject(context))(
				fieldStringToArray(LOGGER_MUTE_FIELDS),
			)
		: trimObject(context);
	return {
		start: () => logger.info(event),
		success: data =>
			logger.info(trimObject({ ...event, result: 'success', data })),
		failure: exception => failureLogger(event)(exception),
		action: action => createEventLogger({ ...event, action }),
	};
};

export const loggerEvent = event => {
	const eventLogger = createEventLogger(event);
	eventLogger.start();
	return eventLogger;
};

const autoLogger = async (callFunction, params, meta = {}) => {
	const event = loggerEvent({
		...meta,
		action: meta.action || callFunction.name,
		...params,
	});

	try {
		const call = callFunction(params, meta);
		const promiseCall = isPromise(call);
		if (!promiseCall) {
			event.success();
			const data = call;
			return data;
		}
		const data = await call;
		event.success();
		return data;
	} catch (e) {
		event.failure(e);
		return Promise.reject(e);
	}
};

export const metaFirstAutoLogger = meta => callFunction => params =>
	autoLogger(callFunction, params, meta);

export const funcFirstAutoLogger = callFunction => async (params, meta) =>
	autoLogger(callFunction, params, meta);

export const withLogger = metaOrFunc =>
	typeof metaOrFunc === 'function'
		? funcFirstAutoLogger(metaOrFunc)
		: metaFirstAutoLogger(metaOrFunc);

// TODO: confirm performance impact when using individual method over decorate them seperately
export const withServiceLogger = helperStandardService => {
	const enhanced = {};
	Object.keys(helperStandardService).forEach(methodName => {
		enhanced[methodName] = (params, meta) =>
			withLogger(meta)(helperStandardService[methodName])(params, meta);
	});
	return enhanced;
};
