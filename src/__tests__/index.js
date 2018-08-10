import logger, {
	logAction,
	logOperation,
	requestIdMiddleware,
	errorToHandler,
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

	it('errorToHandler', () => {
		expect(typeof errorToHandler).toBe('function');
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
