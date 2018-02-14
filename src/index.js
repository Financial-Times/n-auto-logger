import logger from '@financial-times/n-logger';
import {
	trimObject,
	removeObjectKeys,
	fieldStringToArray,
	isPromise,
} from './utils';
import failureLogger from './failure';
import { RESULTS } from './constants';

export * from './error-formatter';

// TODO: support trim nested object leaves?
// N-LOGGER would flatten nested object and logout their leave values
const createEventLogger = meta => {
	const { LOGGER_MUTE_FIELDS } = process.env;
	const filteredMeta = removeObjectKeys(meta)([
		...fieldStringToArray(LOGGER_MUTE_FIELDS),
		'user',
	]);
	const event = trimObject(filteredMeta);
	return {
		start: () => logger.info(event),
		success: data =>
			logger.info(trimObject({ ...event, result: RESULTS.SUCCESS, data })),
		failure: exception => failureLogger(event)(exception),
		action: action => createEventLogger({ ...event, action }),
	};
};

export const loggerEvent = meta => {
	const eventLogger = createEventLogger(meta);
	eventLogger.start();
	return eventLogger;
};

export const autoLog = callFunction => (paramsOrArgs, meta, ...excessive) => {
	if (
		excessive.length ||
		(paramsOrArgs !== undefined && typeof paramsOrArgs !== 'object') ||
		(meta !== undefined && typeof meta !== 'object')
	) {
		throw Error(
			`check the args format of autoLogged function [${
				callFunction.name
			}], it needs to be (params: Object, meta: Object), documents: https://github.com/Financial-Times/n-auto-logger/blob/master/README.md#function-args-format`,
		);
	}

	const event = loggerEvent({
		action: callFunction.name,
		...paramsOrArgs,
		...meta,
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

// TODO: confirm performance impact when using individual method over decorate them seperately
export const autoLogService = helperStandardService => {
	const enhanced = {};
	Object.keys(helperStandardService).forEach(methodName => {
		enhanced[methodName] = (paramsOrArgs, meta) =>
			autoLog(helperStandardService[methodName])(paramsOrArgs, meta);
	});
	return enhanced;
};

export default logger;
