import logger, {
	logAction,
	logOperation,
	setupLoggerInstance,
	requestIdMiddleware,
	autoNext,
	tagService,
	enhancedRender,
	compose,
} from '../index';

describe('n-auto-logger exports', () => {
	it('logger', () => {
		expect(typeof logger).toBe('object');
	});

	it('logAction', () => {
		expect(typeof logAction).toBe('function');
	});

	it('logOperation', () => {
		expect(typeof logOperation).toBe('function');
	});

	it('setupLoggerInstance', () => {
		expect(typeof setupLoggerInstance).toBe('function');
	});

	it('autoNext', () => {
		expect(typeof autoNext).toBe('function');
	});

	it('requestIdMiddleware', () => {
		expect(typeof requestIdMiddleware).toBe('function');
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
