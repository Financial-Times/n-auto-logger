import NError, {
	isFetchError,
	parseFetchError,
} from '@financial-times/n-error';
import { onlyValues, removeObjectKeys } from '@financial-times/n-utils';

import { getLoggerInstance } from './instance';
import { fieldStringToArray } from './utils';
import { CATEGORIES, ALWAYS_MUTTED, UNMUTTABLE, RESULTS } from './constants';

const statusLoggerWithFilter = log => {
	const logger = getLoggerInstance();
	const loggerMuteFields = [
		...fieldStringToArray(process.env.LOGGER_MUTE_FIELDS),
		...ALWAYS_MUTTED,
	].filter(field => !UNMUTTABLE.includes(field));
	const filtered = removeObjectKeys(log)(loggerMuteFields);
	return log.status && log.status < 500
		? logger.warn(filtered)
		: logger.error(filtered);
};

export default (context = {}) => async e => {
	const logger = getLoggerInstance();

	// in case of failure without a specified error, e.g. .failure()
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
		return statusLoggerWithFilter({
			...context,
			result: RESULTS.FAILURE,
			stack,
			...onlyValues(rest),
		});
	}
	// in case of Node Error Object or an extended Node Error Object
	// error codes: https://nodejs.org/api/errors.html#nodejs-error-codes
	if (e instanceof Error) {
		// Error prototype fields wouldn't be append in rest spread
		const { name, code, stack, message, ...rest } = e;
		const reserved = { name, code, stack, message };
		return statusLoggerWithFilter({
			...context,
			result: RESULTS.FAILURE,
			category: Object.keys(rest).length
				? CATEGORIES.CUSTOM_ERROR
				: CATEGORIES.NODE_SYSTEM_ERROR,
			...onlyValues(reserved),
			...onlyValues(rest),
		});
	}
	// in case of NError
	if (e instanceof NError) {
		const { stack, ...rest } = e;
		return statusLoggerWithFilter({
			...context,
			result: RESULTS.FAILURE,
			category: CATEGORIES.CUSTOM_ERROR,
			stack,
			...onlyValues(rest),
		});
	}
	// in case of exception in any format of object not prototyped by Error
	if (e instanceof Object) {
		return statusLoggerWithFilter({
			...context,
			result: RESULTS.FAILURE,
			category: CATEGORIES.CUSTOM_ERROR,
			...onlyValues(e),
		});
	}
	// in case of other exceptions
	return logger.warn({
		...context,
		result: RESULTS.FAILURE,
		message: e,
	});
};
