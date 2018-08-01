import {
	createEnhancer,
	actionOperationAdaptor,
} from '@financial-times/n-express-enhancer';

import logAction from './action';
import logOperation from './operation';

const autoLog = createEnhancer(
	actionOperationAdaptor({
		actionEnhancer: logAction,
		operationEnhancer: logOperation,
	}),
);

export default autoLog;
