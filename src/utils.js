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
