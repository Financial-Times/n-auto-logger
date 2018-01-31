import logger from '@financial-times/n-logger';
import { trimObject } from './utils';

// TODO: consider logics to decide default logger level based on status
// TODO: consider makes it more casual for fire failure log for action
const failureHandler = trimmedEvent => async e => {
	if (
		Object.prototype.hasOwnProperty.call(e, 'headers') &&
		Object.prototype.hasOwnProperty.call(e, 'status') &&
		Object.prototype.hasOwnProperty.call(e, 'ok') &&
		!e.ok
	) {
		// in case of a fetch response error
		// TODO: improve fetch response object identification
		// TODO: handle contentType text/html differently
		// TODO: extract this part to n-error-hanlder to separate error handling from logger
		const response = e;
		const { status, headers } = response;
		const contentType = headers.get('content-type');
		const parseMethod =
			contentType && contentType.includes('application/json') ? 'json' : 'text';
		const loggerLevel = status >= 500 ? 'error' : 'warn';
		const error = await response[parseMethod]();
		logger[loggerLevel](
			trimObject({
				...trimmedEvent,
				result: 'failure',
				status,
				error,
			}),
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
	} else if (e instanceof Error) {
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
	}
	// in case of other exceptions
	return logger.error(
		trimObject({
			...trimmedEvent,
			result: 'exception',
			...e,
		}),
	);
};

export default failureHandler;
