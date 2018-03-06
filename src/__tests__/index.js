import logger, {
	autoLogAction,
	autoLogService,
	autoLogOperation,
	autoLogController,
	loggerEvent,
} from '../index';

describe('n-auto-logger exports', () => {
	it('logger', () => {
		expect(typeof logger).toBe('object');
	});

	it('autoLogAction', () => {
		expect(typeof autoLogAction).toBe('function');
	});

	it('autoLogService', () => {
		expect(typeof autoLogService).toBe('function');
	});

	it('autoLogOperation', () => {
		expect(typeof autoLogOperation).toBe('function');
	});

	it('autoLogController', () => {
		expect(typeof autoLogController).toBe('function');
	});

	it('loggerEvent', () => {
		expect(typeof loggerEvent).toBe('function');
	});
});
