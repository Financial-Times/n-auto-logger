import addTransactionId from '../transaction-id';

it('add transactionId to req.meta', () => {
	const req = {};
	const res = {};
	const next = jest.fn();
	addTransactionId(req, res, next);
	expect(req.meta).toHaveProperty('transactionId', expect.anything());
});
