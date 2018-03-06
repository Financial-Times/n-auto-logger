import logger, {
	autoLogAction,
	autoLogActions,
	autoLogOperation,
	autoLogOps,
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

	it('autoLogOps', () => {
		expect(typeof autoLogOps).toBe('function');
	});

	it('loggerEvent', () => {
		expect(typeof loggerEvent).toBe('function');
	});
});
