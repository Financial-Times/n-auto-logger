import nLogger from '@financial-times/n-logger';

import { setupLoggerInstance, getLoggerInstance } from '../instance';
import createEventLogger from '../event-logger';

describe('instance', () => {
	it('default to n-logger', () => {
		const logger = getLoggerInstance();
		expect(logger).toBe(nLogger);
	});

	it('can be set to other instance and log properly', async () => {
		const alternative = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
		};
		setupLoggerInstance(alternative);
		const logger = getLoggerInstance();
		expect(logger).toBe(alternative);
		const event = createEventLogger({ event: 'USER-SIGNUP' });
		await event.start();
		await event.success();
		await event.failure({ message: 'user with the email already exists' });
		expect(alternative.info.mock.calls).toMatchSnapshot();
		expect(alternative.warn.mock.calls).toMatchSnapshot();
		expect(alternative.error.mock.calls).toMatchSnapshot();
	});
});
