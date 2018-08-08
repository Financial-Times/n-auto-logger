import uuid from 'uuid';

import requestIdMiddleware from '../request-id-middleware';

const mockId = 'xxxx-xxxx-xxxxx-xxxx';
uuid.v4 = jest.fn(() => mockId);

const reqMock = {
	headers: {},
	get: field => reqMock.headers[field],
};

describe('requestIdMiddleware', () => {
	it('add requestId to req.meta if no requestId/transactionId exists in request header', () => {
		const req = reqMock;
		const res = {};
		const next = jest.fn();
		requestIdMiddleware(req, res, next);
		expect(req.meta).toHaveProperty('requestId', mockId);
	});

	it('read requestId to req.meta if it exists in req.header', () => {
		const req = reqMock;
		req.headers.requestId = mockId;
		const res = {};
		const next = jest.fn();
		requestIdMiddleware(req, res, next);
		expect(req.meta).toHaveProperty('requestId', mockId);
	});

	it('read transactionId to req.meta as requestId if it exists in req.header', () => {
		const req = reqMock;
		req.headers.transactionId = mockId;
		const res = {};
		const next = jest.fn();
		requestIdMiddleware(req, res, next);
		expect(req.meta).toHaveProperty('requestId', mockId);
	});
});
