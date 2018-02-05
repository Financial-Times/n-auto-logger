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
	fieldString.split(',').map(keyName => keyName.trim());

export const isPromise = value => Promise.resolve(value) === value;
