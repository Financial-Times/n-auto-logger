jest.mock('@financial-times/n-logger');
import logger from '@financial-times/n-logger';
import { loggerEvent } from '../index';

describe('n-event-logger', () => {
	describe('loggerEvent', () => {
		const commonMeta = {
			operation: 'test',
			action: '',
			userId: 'test',
			transactionId: 'test',
			a: 'test',
			b: 'test'
		};

		afterEach(() => {
			jest.resetAllMocks();
		});

		it('should create the correct logger when fire the success method', () => {
			const event = loggerEvent(commonMeta);
			event.success({ d: 'some data' });
			expect(logger.info.mock.calls.length).toBe(2);
			expect(logger.info.mock.calls[1][0]).toMatchObject({
				...commonMeta,
				result: 'success',
				data: { d: 'some data' }
			});
		});

		it('should create the correct logger when fire the failure method', () => {
			const event = loggerEvent(commonMeta);
			event.failure({ message: 'some error message' });
			expect(logger.info.mock.calls.length).toBe(1);
			expect(logger.warn.mock.calls[0][0]).toMatchObject({
				...commonMeta,
				result: 'failure',
				message: 'some error message'
			});
		});
	});
});
