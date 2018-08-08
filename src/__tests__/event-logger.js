import logger from '../index';
import createEventLogger from '../event-logger';

jest.mock('@financial-times/n-logger');

describe('createEventLogger', () => {
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

	const commonEvent = createEventLogger(commonMeta);

	describe('fires logger', () => {
		it('info with .start()', () => {
			commonEvent.start();
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('info with .success()', () => {
			commonEvent.success({ d: 'some data', e: 'some other data' });
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('failureLogger with .failure()', () => {
			commonEvent.failure({ message: 'some error message' });
			expect(logger.error.mock.calls).toMatchSnapshot();
		});
	});

	describe('filter in input meta data of', () => {
		it('empty or undefined field', () => {
			commonEvent.start();
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('fields defined in LOGGER_MUTE_FIELDS', () => {
			// currently ENV_VAR would only be effective when they were set before createEventLogger
			process.env.LOGGER_MUTE_FIELDS = 'transactionId, userId';
			const event = createEventLogger(commonMeta);
			event.start();
			expect(logger.info.mock.calls).toMatchSnapshot();
			delete process.env.LOGGER_MUTE_FIELDS;
		});

		it('data nested in user field', () => {
			const commonMetaWithUser = {
				...commonMeta,
				user: { message: 'please ask help center' },
			};
			const event = createEventLogger(commonMetaWithUser);
			event.start();
			expect(logger.info.mock.calls).toMatchSnapshot();
		});

		it('function fields', () => {
			const commonMetaWithFunc = {
				...commonMeta,
				func: () => null,
			};
			const event = createEventLogger(commonMetaWithFunc);
			event.start();
			expect(logger.info.mock.calls).toMatchSnapshot();
		});
	});
});
