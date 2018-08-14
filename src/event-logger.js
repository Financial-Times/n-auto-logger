import logger from '@financial-times/n-logger';
import { onlyValues, removeObjectKeys } from '@financial-times/n-utils';

import failureLogger from './failure-logger';
import { fieldStringToArray } from './utils';
import { RESULTS, ALWAYS_MUTTED } from './constants';

const createEventLogger = meta => {
	const mutedMetaFields = [
		...fieldStringToArray(process.env.LOGGER_MUTE_FIELDS),
		...ALWAYS_MUTTED,
	];
	const filteredMeta = removeObjectKeys(meta)(mutedMetaFields);
	const event = onlyValues(filteredMeta);
	return {
		start: () => logger.info(event),
		success: data =>
			logger.info(onlyValues({ ...event, result: RESULTS.SUCCESS, data })),
		failure: error => failureLogger(event)(error),
	};
};

export default createEventLogger;
