import logger from '@financial-times/n-logger';

export {
	autoLogOp,
	autoLogOps,
	toMiddleware,
	toMiddlewares,
	autoLogOpToMiddleware,
	autoLogOpsToMiddlewares,
} from './operation';
export { autoLogAction, autoLogActions } from './action';
export { loggerEvent } from './event';

export default logger;
