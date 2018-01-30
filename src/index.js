import logger from '@financial-times/n-logger';
import { trimObject, removeObjectKeys, fieldStringToArray } from './utils';

// TODO: consider logics to decide default logger level based on status
// TODO: consider makes it more casual for fire failure log for action
const failureHandler = trimmedEvent => e => {
	if (e instanceof Error) {
		// in case of Node system standard error
		// this includes Network error threw by fetch
		// error codes: https://nodejs.org/api/errors.html#nodejs-error-codes
		const { code, message, stack } = e;
		return logger.error(
			trimObject({
				...trimmedEvent,
				result: 'system error',
				code,
				message,
				stack,
			}),
		);
	} else if (
		Object.prototype.hasOwnProperty.call(e, 'headers') &&
		Object.prototype.hasOwnProperty.call(e, 'status') &&
		Object.prototype.hasOwnProperty.call(e, 'ok') &&
		!e.ok
	) {
		// in case of a fetch response error
		// TODO: improve fetch response object identification
		const response = e;
		const { status, headers } = response;
		const contentType = headers.get('content-type');
		return response[
			contentType && contentType.includes('application/json') ? 'json' : 'text'
		]().then(error =>
			logger[status >= 500 ? 'error' : 'warn'](
				trimObject({
					...trimmedEvent,
					result: 'failure',
					status,
					error,
				}),
			),
		);
	} else if (Object.prototype.hasOwnProperty.call(e, 'status')) {
		// in case of custom error objects complying with the standards
		// TODO: consider integrate the standard error object classs
		const { status, reason, data } = e;
		return logger[status >= 500 ? 'error' : 'warn'](
			trimObject({
				...trimmedEvent,
				result: 'failure',
				status,
				reason,
				data,
			}),
		);
	}
	// in case of other exceptions
	return logger.error(
		trimObject({
			...trimmedEvent,
			result: 'unhandled exception',
			...e,
		}),
	);
};

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
		failure: e => failureHandler(trimmedEvent)(e),
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
