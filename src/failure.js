import logger from '@financial-times/n-logger';
import fetch from 'node-fetch';
import { trimObject } from './utils';
import {
	formatFetchResponseError,
	formatFetchNetworkError,
} from './error-formatter';

// TODO: consider logics to decide default logger level based on status
// 	use warn for errors wouldn't be cause the by the codebase, error for those possibly are
// TODO: consider makes it easier to fire action failure log
const failureLogger = (context = {}) => async e => {
	// in case of a fetch response error
	if (e instanceof fetch.Response) {
		const response = e;
		const loggerLevel = response.status >= 500 ? 'error' : 'warn';
		const formattedError = await formatFetchResponseError(response);
		return logger[loggerLevel](
			trimObject({
				...context,
				result: 'failure',
				...formattedError,
			}),
		);
	}
	// in case of fetch error, typically network error
	if (e instanceof fetch.FetchError) {
		const formattedError = formatFetchNetworkError(e);
		return logger.error(
			trimObject({
				...context,
				result: 'failure',
				...formattedError,
			}),
		);
	}
	// in case of n-event-logger complied formatted error standard
	// TODO: define the formatted error standard as n-error-standard
	// TODO: how to support various different format of formatted errors in different apps
	if (Object.prototype.hasOwnProperty.call(e, 'status')) {
		return logger[e.status >= 500 ? 'error' : 'warn'](
			trimObject({
				...context,
				result: 'failure',
				type: 'FORMATTED_EXCEPTION',
				...e,
			}),
		);
	}
	// in case of Node system standard error
	// error codes: https://nodejs.org/api/errors.html#nodejs-error-codes
	if (e instanceof Error) {
		const { code, message, stack } = e;
		return logger.error(
			trimObject({
				...context,
				result: 'failure',
				type: 'NODE_SYSTEM_ERROR',
				code,
				message,
				stack,
			}),
		);
	}
	// in case of other exceptions
	return logger.error(
		trimObject({
			...context,
			result: 'failure',
			type: 'UNFORMATTED_EXCEPTION',
			...e,
		}),
	);
};

export default failureLogger;
