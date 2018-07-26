import logAction from './action';
import logOperation from './operation';

const adaptor = targetFunction => {
	if (targetFunction.length >= 2) {
		return logOperation(targetFunction);
	}
	if (targetFunction.length === 1) {
		return logAction(targetFunction);
	}
	throw Error(
		`targetFunction ${
			targetFunction.name
		} can not be decorated with autoLogger`,
	);
};

export default adaptor;
