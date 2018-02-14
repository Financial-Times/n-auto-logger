import 'isomorphic-fetch';
import fetch from 'node-fetch';
import logger from '@financial-times/n-logger';
import { formatFetchError } from '@financial-times/n-error';

import { trimObject, removeObjectKeys } from './utils';
import { CATEGORIES, RESULTS } from './constants';

// TODO: consider logics to decide default logger level based on status
// 	use warn for errors wouldn't be cause the by the codebase, error for those possibly are
const failureLogger = (context = {}) => async e => {
	// in case of failure without a specified error, e.g. .action('someAction').failure()
	if (typeof e === 'undefined' || e === null) {
		return logger.warn({
			...context,
			result: RESULTS.FAILURE,
		});
	}
	// in case of a fetch response error
	if (e instanceof fetch.Response || e instanceof Response) {
		const response = e;
		const loggerLevel = response.status >= 500 ? 'error' : 'warn';
		const formattedError = await formatFetchError(response);
		return logger[loggerLevel]({
			...context,
			result: RESULTS.FAILURE,
			...formattedError,
		});
	}
	// in case of fetch error, typically network error
	if (e instanceof fetch.FetchError) {
		const formattedError = await formatFetchError(e);
		return logger.error({
			...context,
			result: RESULTS.FAILURE,
			...formattedError,
		});
	}
	// in case of Node Error Object or an extended Node Error Object
	// error codes: https://nodejs.org/api/errors.html#nodejs-error-codes
	if (e instanceof Error) {
		const { code, message, stack, ...rest } = e; // ...e wouldn't spread the properties of Error
		return logger.error(
			trimObject({
				...context,
				result: RESULTS.FAILURE,
				category: Object.keys(rest).length
					? CATEGORIES.CUSTOM_ERROR
					: CATEGORIES.NODE_SYSTEM_ERROR,
				code,
				message,
				stack,
				...removeObjectKeys(rest)(['user']), // if e.category would override the above
			}),
		);
	}
	// in case of exception in any format of object not prototyped by Error
	if (e instanceof Object) {
		return logger[e.status >= 500 ? 'error' : 'warn']({
			...context,
			result: RESULTS.FAILURE,
			category: CATEGORIES.CUSTOM_ERROR,
			...trimObject(e),
		});
	}
	// in case of other exceptions
	return logger.warn({
		...context,
		result: RESULTS.FAILURE,
		message: e,
	});
};

export default failureLogger;
