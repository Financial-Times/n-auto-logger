import logger from '@financial-times/n-logger';

const createEventLogger = event => ({
	start: () => logger.info(event),
	success: data => logger.info({ ...event, result: 'success', data }),
	failure: ({ message, status, data }) =>
		logger[status >= 500 ? 'error' : 'warn']({
			...event,
			result: 'failure',
			message,
			...data,
		}),
	action: action => createEventLogger({ ...event, action }),
});

// TODO: support surpress meta such as transactionId, userId locally for dev
// TODO: failure input to be compatible with Error format standard
// TODO: use callback function to selectively log result data
// TODO: add support to enhance non-async callFunction without using await
export const loggerEvent = event => {
	const eventLogger = createEventLogger(event);
	eventLogger.start();
	return eventLogger;
};

export const withLogger = (
	meta = {},
	options = {},
) => callFunction => async params => {
	const event = loggerEvent({
		...meta,
		action: meta.action || callFunction.name,
		...params,
	});

	const { logResult = false } = options;

	try {
		const data = await callFunction(params, meta);
		event.success(logResult ? data : null);
		return data;
	} catch (e) {
		event.failure(e);
		return Promise.reject(e);
	}
};

// TODO: confirm performance impact when using individual method over decorate them seperately
export const withServiceLogger = helperStandardService => {
	const enhanced = {};
	Object.keys(helperStandardService).forEach(methodName => {
		enhanced[methodName] = (params, meta) =>
			withLogger(meta)(helperStandardService[methodName])(params, meta);
	});
	return enhanced;
};
