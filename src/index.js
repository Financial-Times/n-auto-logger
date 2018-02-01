import logger from '@financial-times/n-logger';
import { trimObject, removeObjectKeys, fieldStringToArray } from './utils';
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

// TODO: add support to enhance non-async callFunction without using await
export const loggerEvent = event => {
	const eventLogger = createEventLogger(event);
	eventLogger.start();
	return eventLogger;
};

export const withLogger = (meta = {}) => callFunction => async params => {
	const event = loggerEvent({
		...meta,
		action: meta.action || callFunction.name,
		...params,
	});

	try {
		const data = await callFunction(params, meta);
		event.success();
		return data;
	} catch (e) {
		event.failure(e);
		return Promise.reject(e);
	}
};

// TODO: confirm performance impact when using individual method over decorate them seperately
export const withServiceLogger = helperStandardService => {
	const enhanced = {};
	Object.keys(helperStandardService).forEach(methodName => {
		enhanced[methodName] = (params, meta) =>
			withLogger(meta)(helperStandardService[methodName])(params, meta);
	});
	return enhanced;
};
