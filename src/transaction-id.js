import uuid from 'uuid';

const addTransactionId = (req, res, next) => {
	const transactionId = uuid.v4();
	req.meta = {
		...req.meta,
		transactionId,
	};
	next();
};

export default addTransactionId;
