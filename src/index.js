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

export const autoLog = callFunction => (params, meta, ...excessive) => {
	if (
		excessive.length ||
		(params !== undefined && typeof params !== 'object') ||
		(meta !== undefined && typeof meta !== 'object')
	) {
		throw Error(
			`check the args format of autoLogged function [${
				callFunction.name
			}], it needs to be (params: Object, meta: Object), documents: https://github.com/Financial-Times/n-auto-logger/blob/master/README.md#function-args-format`,
		);
	}

	const event = loggerEvent({
		...meta,
		action: callFunction.name,
		...params,
	});

	try {
		const call = callFunction(params, meta);
		if (isPromise(call)) {
			return call
				.then(data => {
					event.success();
					return data;
				})
				.catch(e => {
					event.failure(e);
					return Promise.reject(e);
				});
		}
		const data = call;
		event.success();
		return data;
	} catch (e) {
		event.failure(e);
		return Promise.reject(e);
	}
};

// TODO: confirm performance impact when using individual method over decorate them seperately
export const autoLogService = helperStandardService => {
	const enhanced = {};
	Object.keys(helperStandardService).forEach(methodName => {
		enhanced[methodName] = (params, meta) =>
			autoLog(helperStandardService[methodName])(params, meta);
	});
	return enhanced;
};

export default logger;
