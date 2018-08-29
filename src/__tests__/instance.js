import nLogger from '@financial-times/n-logger';
import winston from 'winston';
import MaskLogger from '@financial-times/n-mask-logger';

import { setupLoggerInstance, getLoggerInstance } from '../instance';
import createEventLogger from '../event-logger';

jest.mock('winston');

describe('instance', () => {
	it('default to n-logger', () => {
		const logger = getLoggerInstance();
		expect(logger).toBe(nLogger);
	});

	it('can be set to winston and log properly', async () => {
		setupLoggerInstance(winston);
		const logger = getLoggerInstance();
		expect(logger).toBe(winston);
		const event = createEventLogger({ event: 'USER-SIGNUP' });
		await event.start();
		await event.success();
		await event.failure({ message: 'user with the email already exists' });
		expect(logger.info.mock.calls).toMatchSnapshot();
		expect(logger.warn.mock.calls).toMatchSnapshot();
		expect(logger.error.mock.calls).toMatchSnapshot();
	});

	it('can be set to MaskLogger and log properly', async () => {
		const maskLogger = new MaskLogger(['email', 'password']);
		setupLoggerInstance(maskLogger);
		const logger = getLoggerInstance();
		expect(logger).toBe(maskLogger);
		jest.spyOn(maskLogger, 'info');
		jest.spyOn(maskLogger, 'warn');
		jest.spyOn(maskLogger, 'error');
		const event = createEventLogger({
			event: 'USER-LOGIN',
			password: 'dummy-password',
		});
		await event.start();
		await event.success();
		await event.failure({ message: 'user with the email already exists' });
		expect(maskLogger.info.mock.calls).toMatchSnapshot();
		expect(maskLogger.warn.mock.calls).toMatchSnapshot();
		expect(maskLogger.error.mock.calls).toMatchSnapshot();
	});
});
