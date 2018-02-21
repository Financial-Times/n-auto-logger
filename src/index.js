import logger from '@financial-times/n-logger';
import {
	onlyValues,
	removeObjectKeys,
	fieldStringToArray,
	isPromise,
} from './utils';
import failureLogger from './failure';
import { RESULTS } from './constants';

// TODO: support deepTrimObject / deepOnlyValues
// N-LOGGER would flatten nested object and logout their leave values
const createEventLogger = meta => {
	const { LOGGER_MUTE_FIELDS } = process.env;
	const filteredMeta = removeObjectKeys(meta)([
		...fieldStringToArray(LOGGER_MUTE_FIELDS),
		'user',
	]);
	const event = onlyValues(filteredMeta);
	return {
		start: () => logger.info(event),
		success: data =>
			logger.info(onlyValues({ ...event, result: RESULTS.SUCCESS, data })),
		failure: error => failureLogger(event)(error),
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

export const autoLogService = helperStandardService => {
	const enhanced = {};
	Object.keys(helperStandardService).forEach(methodName => {
		enhanced[methodName] = (paramsOrArgs, meta) =>
			autoLog(helperStandardService[methodName])(paramsOrArgs, meta);
	});
	return enhanced;
};

export default logger;
