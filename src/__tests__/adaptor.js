import logger from '../index';
import adaptor from '../adaptor';

jest.mock('@financial-times/n-logger');

describe('adaptor', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('recognise and enhance action function correctly', () => {
		const actionFunction = ({ paramA, meta }) => ({ paramA, ...meta });
		const enhanced = adaptor(actionFunction);
		const paramA = 'a';
		const meta = { userId: 'mock-id' };
		const result = enhanced({ paramA, meta });
		expect(result).toMatchSnapshot();
		expect(logger.info.mock.calls).toMatchSnapshot();
	});

	it('recognise and enhance operation function correctly', async () => {
		const operationFunction = (meta, req) => {
			req.meta = meta;
		};
		const enhanced = adaptor(operationFunction);
		const meta = { userId: 'mock-id' };
		const req = {};
		await enhanced(meta, req);
		expect(req.meta).toMatchSnapshot();
		expect(logger.info.mock.calls).toMatchSnapshot();
	});
});
