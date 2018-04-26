import logger, {
	autoLogAction,
	autoLogActions,
	logOperation,
	toMiddleware,
	loggerEvent,
	enhancedRender,
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

	it('logOperation', () => {
		expect(typeof logOperation).toBe('function');
	});

	it('toMiddleware', () => {
		expect(typeof toMiddleware).toBe('function');
	});

	it('loggerEvent', () => {
		expect(typeof loggerEvent).toBe('function');
	});

	it('enhancedRender', () => {
		expect(typeof enhancedRender).toBe('function');
	});
});
