export const emptyCheck = value => {
	if (
		value === null ||
		typeof value === 'undefined' ||
		(typeof value === 'string' && value === '')
	) {
		return true;
	}
	return false;
};

export const trimObject = obj => {
	const output = Object.create(obj);
	Object.keys(obj).forEach(key => {
		const emtpy = emptyCheck(obj[key]);
		if (!emtpy) {
			output[key] = obj[key];
		}
	});
	return output;
};

export const onlyValues = obj => {
	const output = Object.create(obj);
	Object.keys(obj).forEach(key => {
		const isEmtpy = emptyCheck(obj[key]);
		const isFunc = typeof obj[key] === 'function';
		if (!isEmtpy && !isFunc) {
			output[key] = obj[key];
		}
	});
	return output;
};

export const removeObjectKeys = obj => keys => {
	if (!Array.isArray(keys)) {
		throw Error('keys need to be formatted in array');
	}
	const output = {};
	Object.keys(obj).forEach(key => {
		const toBeRemoved = keys.includes(key);
		if (!toBeRemoved) {
			output[key] = obj[key];
		}
	});
	return output;
};

export const fieldStringToArray = fieldString =>
	typeof fieldString === 'string' && fieldString !== ''
		? fieldString.split(',').map(keyName => keyName.trim())
		: [];

export const isPromise = value => Promise.resolve(value) === value;

export const assertErrorLog = e => {
	const { stack, ...rest } = e;
	expect(stack.length).toBeGreaterThan(0);
	expect(rest).toMatchSnapshot();
};
