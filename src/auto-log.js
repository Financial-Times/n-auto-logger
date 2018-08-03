import { createAdaptableEnhancer } from '@financial-times/n-express-enhancer';

import logAction from './action-enhancement';
import logOperation from './operation-enhancement';

const autoLog = createAdaptableEnhancer({
	actionEnhancement: logAction,
	operationEnhancement: logOperation,
});

export default autoLog;
