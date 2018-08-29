import nLogger from '@financial-times/n-logger';

let logger = nLogger;

export const setupLoggerInstance = instance => {
	logger = instance;
};

export const getLoggerInstance = () => logger;
