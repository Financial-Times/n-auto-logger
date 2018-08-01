import logger, {
	loggerEvent,
	logAction,
	logOperation,
	autoLog,
	addTransactionId,
	toMiddleware,
	tagService,
	enhancedRender,
	compose,
} from '../index';

describe('n-auto-logger exports', () => {
	it('logger', () => {
		expect(typeof logger).toBe('object');
	});

	it('loggerEvent', () => {
		expect(typeof loggerEvent).toBe('function');
	});

	it('logAction', () => {
		expect(typeof logAction).toBe('function');
	});

	it('logOperation', () => {
		expect(typeof logOperation).toBe('function');
	});

	it('autoLog', () => {
		expect(typeof autoLog).toBe('function');
	});

	it('toMiddleware', () => {
		expect(typeof toMiddleware).toBe('function');
	});

	it('addTransactionId', () => {
		expect(typeof addTransactionId).toBe('function');
	});

	it('tagService', () => {
		expect(typeof tagService).toBe('function');
	});

	it('enhancedRender', () => {
		expect(typeof enhancedRender).toBe('function');
	});

	it('compose', () => {
		expect(typeof compose).toBe('function');
	});
});
