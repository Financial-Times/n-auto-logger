import logger from '@financial-times/n-logger';
import { trimObject, removeObjectKeys, fieldStringToArray } from './utils';

// TODO: testing nested data fields
const createEventLogger = event => {
	const { LOGGER_MUTE_FIELDS } = process.env;
	const trimmedEvent = LOGGER_MUTE_FIELDS
		? removeObjectKeys(trimObject(event))(
				fieldStringToArray(LOGGER_MUTE_FIELDS),
			)
		: trimObject(event);
	return {
		start: () => logger.info(trimmedEvent),
		success: data =>
			logger.info(trimObject({ ...trimmedEvent, result: 'success', data })),
		failure: ({ message, status, data }) =>
			logger[status >= 500 ? 'error' : 'warn'](
				trimObject({
					...trimmedEvent,
					result: 'failure',
					message,
					status,
					data,
				}),
			),
		action: action => createEventLogger({ ...trimmedEvent, action }),
	};
};

// TODO: failure input to be compatible with Error format standard
// TODO: use callback function to selectively log result data
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
