import logger from '@financial-times/n-logger';
import NError, {
	isFetchError,
	parseFetchError,
} from '@financial-times/n-error';

import { onlyValues, removeObjectKeys } from './utils';
import { CATEGORIES, RESULTS } from './constants';

// TODO: consider logics to decide default logger level based on status
// for generic error without status or falsely reported error, use 'error'
const statusLogger = e => log =>
	e.status && e.status < 500 ? logger.warn(log) : logger.error(log);

export default (context = {}) => async e => {
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
		const parsed = await parseFetchError(e); // parsed: NError
		const { stack, ...rest } = parsed;
		return statusLogger(parsed)({
			...context,
			result: RESULTS.FAILURE,
			stack,
			...onlyValues(removeObjectKeys(rest)(['user'])),
		});
	}
	// in case of Node Error Object or an extended Node Error Object
	// error codes: https://nodejs.org/api/errors.html#nodejs-error-codes
	if (e instanceof Error) {
		// Error prototype fields wouldn't be append in rest spread
		const { name, code, stack, message, ...rest } = e;
		const reserved = { name, code, stack, message };
		return statusLogger(e)({
			...context,
			result: RESULTS.FAILURE,
			category: Object.keys(rest).length
				? CATEGORIES.CUSTOM_ERROR
				: CATEGORIES.NODE_SYSTEM_ERROR,
			...onlyValues(reserved),
			...onlyValues(removeObjectKeys(rest)(['user'])),
		});
	}
	// in case of NError
	if (e instanceof NError) {
		const { stack, ...rest } = e;
		return statusLogger(e)({
			...context,
			result: RESULTS.FAILURE,
			category: CATEGORIES.CUSTOM_ERROR,
			stack,
			...onlyValues(removeObjectKeys(rest)(['user'])),
		});
	}
	// in case of exception in any format of object not prototyped by Error
	if (e instanceof Object) {
		return statusLogger(e)({
			...context,
			result: RESULTS.FAILURE,
			category: CATEGORIES.CUSTOM_ERROR,
			...onlyValues(removeObjectKeys(e)(['user'])),
		});
	}
	// in case of other exceptions
	return logger.warn({
		...context,
		result: RESULTS.FAILURE,
		message: e,
	});
};
