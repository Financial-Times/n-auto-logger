import logger, {
	autoLogOperation,
	autoLog,
	autoLogService,
	loggerEvent,
} from '../index';

describe('n-auto-logger exports', () => {
	it('logger', () => {
		expect(typeof logger).toBe('object');
	});

	it('autoLogOperation', () => {
		expect(typeof autoLogOperation).toBe('function');
	});

	it('autoLog', () => {
		expect(typeof autoLog).toBe('function');
	});

	it('autoLogService', () => {
		expect(typeof autoLogService).toBe('function');
	});

	it('loggerEvent', () => {
		expect(typeof loggerEvent).toBe('function');
	});
});
