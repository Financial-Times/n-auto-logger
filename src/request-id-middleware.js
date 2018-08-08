import uuid from 'uuid';

const requestIdMiddleware = async (req, res, next) => {
	try {
		const requestId =
			req.get('requestId') || req.get('transacionId') || uuid.v4();
		req.meta = {
			...req.meta,
			requestId,
		};
		next();
	} catch (e) {
		next(e);
	}
};

export default requestIdMiddleware;
