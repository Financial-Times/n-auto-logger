import logger, {
	autoLogAction,
	autoLogActions,
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

	it('autoLogActions', () => {
		expect(typeof autoLogActions).toBe('function');
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
