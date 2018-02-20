import logger from '@financial-times/n-logger';
import { isFetchError, parseFetchError } from '@financial-times/n-error';

import { trimObject, removeObjectKeys } from './utils';
import { CATEGORIES, RESULTS } from './constants';

const errorLog = e => {
	const { code, message, stack, ...rest } = e; // ...e wouldn't spread the properties of Error
	return trimObject({
		category: Object.keys(rest).length
			? CATEGORIES.CUSTOM_ERROR
			: CATEGORIES.NODE_SYSTEM_ERROR,
		code,
		message,
		stack,
		...removeObjectKeys(rest)(['user']), // `category` key here would override the above
	});
};

// TODO: consider logics to decide default logger level based on status
// for generic error without status or falsely reported error, use 'error'
const statusLogger = e => log =>
	e.status && e.status < 500 ? logger.warn(log) : logger.error(log);

const failureLogger = (context = {}) => async e => {
	// in case of failure without a specified error, e.g. .action('someAction').failure()
	if (typeof e === 'undefined' || e === null) {
		return logger.warn({
			...context,
			result: RESULTS.FAILURE,
		});
	}
	// in case of a fetch error, both Response Error and Network Error
	// find more details in https://github.com/Financial-Times/n-error/blob/master/src/parser.js
	if (isFetchError(e)) {
		const parsed = await parseFetchError(e);
		return statusLogger(parsed)({
			...context,
			result: RESULTS.FAILURE,
			...errorLog(parsed),
		});
	}
	// in case of Node Error Object or an extended Node Error Object
	// error codes: https://nodejs.org/api/errors.html#nodejs-error-codes
	if (e instanceof Error) {
		return statusLogger(e)({
			...context,
			result: RESULTS.FAILURE,
			...errorLog(e),
		});
	}
	// in case of exception in any format of object not prototyped by Error
	if (e instanceof Object) {
		return statusLogger(e)({
			...context,
			result: RESULTS.FAILURE,
			category: CATEGORIES.CUSTOM_ERROR,
			...trimObject(removeObjectKeys(e)(['user'])),
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
