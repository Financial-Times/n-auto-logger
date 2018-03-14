import logger from '@financial-times/n-logger';
import { onlyValues, removeObjectKeys } from '@financial-times/n-utils';

import { fieldStringToArray } from './utils';
import failureLogger from './failure';
import { RESULTS, ALWAYS_MUTTED } from './constants';

// TODO: support deepTrimObject / deepOnlyValues
// N-LOGGER would flatten nested object and logout their leave values
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
		action: action => createEventLogger({ ...event, action }),
	};
};

export const loggerEvent = meta => {
	const eventLogger = createEventLogger(meta);
	eventLogger.start();
	return eventLogger;
};

export default loggerEvent;
