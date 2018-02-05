import logger from '@financial-times/n-logger';
import fetch from 'node-fetch';
import {
	formatFetchResponseError,
	formatFetchNetworkError,
} from './error-formatter';

// TODO: consider logics to decide default logger level based on status
// 	use warn for errors wouldn't be cause the by the codebase, error for those possibly are
const failureLogger = (context = {}) => async e => {
	// in case of failure without a specified error, e.g. .action('someAction').failure()
	if (typeof e === 'undefined') {
		return logger.warn({
			...context,
			result: 'failure',
		});
	}
	// in case of a fetch response error
	if (e instanceof fetch.Response) {
		const response = e;
		const loggerLevel = response.status >= 500 ? 'error' : 'warn';
		const formattedError = await formatFetchResponseError(response);
		return logger[loggerLevel]({
			...context,
			result: 'failure',
			category: 'FETCH_RESPONSE_ERROR',
			...formattedError,
		});
	}
	// in case of fetch error, typically network error
	if (e instanceof fetch.FetchError) {
		const formattedError = formatFetchNetworkError(e);
		return logger.error({
			...context,
			result: 'failure',
			category: 'FETCH_NETWORK_ERROR',
			...formattedError,
		});
	}
	// in case of Node system standard error
	// error codes: https://nodejs.org/api/errors.html#nodejs-error-codes
	if (e instanceof Error) {
		const { code, message, stack } = e; // ...e wouldn't spread the properties of Error
		return logger.error({
			...context,
			result: 'failure',
			category: 'NODE_SYSTEM_ERROR',
			code,
			message,
			stack,
		});
	}
	// in case of exception in any format of object not prototyped by Error
	if (e instanceof Object) {
		return logger[e.status >= 500 ? 'error' : 'warn']({
			...context,
			result: 'failure',
			category: 'EXCEPTION',
			...e,
		});
	}
	// in case of other exceptions
	return logger.error({
		...context,
		result: 'failure',
	});
};

export default failureLogger;
