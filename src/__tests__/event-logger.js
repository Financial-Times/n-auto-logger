import logger from '../index';
import loggerEvent from '../event-logger';
import { CATEGORIES, RESULTS } from '../constants';

jest.mock('@financial-times/n-logger');

describe('loggerEvent', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});
	const commonMeta = {
		operation: 'test',
		action: '',
		userId: 'test',
		transactionId: 'test',
		a: 'test',
		b: 'test',
	};

	const commonTrimmedMeta = {
		operation: 'test',
		userId: 'test',
		transactionId: 'test',
		a: 'test',
		b: 'test',
	};

	describe('fires logger', () => {
		it('info when initialised', () => {
			loggerEvent(commonMeta);
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.info.mock.calls[0][0]).toEqual(commonTrimmedMeta);
		});

		it('info with .success()', () => {
			const event = loggerEvent(commonMeta);
			event.success({ d: 'some data', e: 'some other data' });
			expect(logger.info.mock.calls).toHaveLength(2);
			expect(logger.info.mock.calls[1][0]).toEqual({
				...commonTrimmedMeta,
				result: RESULTS.SUCCESS,
				data: { d: 'some data', e: 'some other data' },
			});
		});

		it('failureLogger with .failure()', () => {
			const event = loggerEvent(commonMeta);
			event.failure({ message: 'some error message' });
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.error.mock.calls[0][0]).toEqual({
				...commonTrimmedMeta,
				result: RESULTS.FAILURE,
				category: CATEGORIES.CUSTOM_ERROR,
				message: 'some error message',
			});
		});
	});

	describe('filter in input meta data of', () => {
		it('empty or undefined field', () => {
			loggerEvent(commonMeta);
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.info.mock.calls[0][0]).toEqual(commonTrimmedMeta);
		});

		it('fields defined in LOGGER_MUTE_FIELDS', () => {
			process.env.LOGGER_MUTE_FIELDS = 'transactionId, userId';
			const mutedMeta = {
				operation: 'test',
				a: 'test',
				b: 'test',
			};
			loggerEvent(commonMeta);
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.info.mock.calls[0][0]).toEqual(mutedMeta);
			delete process.env.LOGGER_MUTE_FIELDS;
		});

		it('data nested in user field', () => {
			const commonMetaWithUser = {
				...commonMeta,
				user: { message: 'please ask help center' },
			};
			loggerEvent(commonMetaWithUser);
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.info.mock.calls[0][0]).toEqual(commonTrimmedMeta);
		});

		it('function fields', () => {
			const commonMetaWithFunc = {
				...commonMeta,
				func: () => null,
			};
			loggerEvent(commonMetaWithFunc);
			expect(logger.info.mock.calls).toHaveLength(1);
			expect(logger.info.mock.calls[0][0]).toEqual(commonTrimmedMeta);
		});
	});
});
