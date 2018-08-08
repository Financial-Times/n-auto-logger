import logger from '@financial-times/n-logger';
import { onlyValues, removeObjectKeys } from '@financial-times/n-utils';

import { fieldStringToArray } from './utils';
import failureLogger from './failure-logger';
import { RESULTS, ALWAYS_MUTTED } from './constants';

const createEventLogger = meta => {
	const loggerMuteFields = [
		...fieldStringToArray(process.env.LOGGER_MUTE_FIELDS),
		...ALWAYS_MUTTED,
	];
	const filteredMeta = removeObjectKeys(meta)(loggerMuteFields);
	const event = onlyValues(filteredMeta);
	return {
		start: () => logger.info(event),
		success: data =>
			logger.info(onlyValues({ ...event, result: RESULTS.SUCCESS, data })),
		failure: error => failureLogger(event)(error),
	};
};

export default createEventLogger;
