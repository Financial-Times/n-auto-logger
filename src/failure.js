import 'isomorphic-fetch';
import logger from '@financial-times/n-logger';
import fetch from 'node-fetch';
import {
	formatFetchResponseError,
	formatFetchNetworkError,
} from './error-formatter';
import { trimObject } from './utils';

// TODO: consider logics to decide default logger level based on status
// 	use warn for errors wouldn't be cause the by the codebase, error for those possibly are
const failureLogger = (context = {}) => async e => {
	// in case of failure without a specified error, e.g. .action('someAction').failure()
	if (typeof e === 'undefined' || e === null) {
		return logger.warn({
			...context,
			result: 'failure',
		});
	}
	// in case of a fetch response error
	if (e instanceof fetch.Response || e instanceof Response) {
		const response = e;
		const loggerLevel = response.status >= 500 ? 'error' : 'warn';
		const formattedError = await formatFetchResponseError(response);
		return logger[loggerLevel]({
			...context,
			result: 'failure',
			...formattedError,
		});
	}
	// in case of fetch error, typically network error
	if (e instanceof fetch.FetchError) {
		const formattedError = formatFetchNetworkError(e);
		return logger.error({
			...context,
			result: 'failure',
			...formattedError,
		});
	}
	// in case of Node Error Object or an extended Node Error Object
	// error codes: https://nodejs.org/api/errors.html#nodejs-error-codes
	if (e instanceof Error) {
		const { code, message, stack, ...rest } = e; // ...e wouldn't spread the properties of Error
		return logger.error({
			...context,
			result: 'failure',
			category: Object.keys(rest).length ? 'EXCEPTION' : 'NODE_SYSTEM_ERROR',
			code,
			message,
			stack,
			...rest, // if e.category would override the above
		});
	}
	// in case of exception in any format of object not prototyped by Error
	if (e instanceof Object) {
		return logger[e.status >= 500 ? 'error' : 'warn']({
			...context,
			result: 'failure',
			category: 'EXCEPTION',
			...trimObject(e),
		});
	}
	// in case of other exceptions
	return logger.warn({
		...context,
		result: 'failure',
		message: e,
	});
};

export default failureLogger;
