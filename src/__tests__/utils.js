import {
	emptyCheck,
	trimObject,
	removeObjectKeys,
	fieldStringToArray,
	isPromise,
} from '../utils';

describe('emptyCheck', () => {
	describe('should return true', () => {
		it('if value is undefined', () => {
			const value = undefined;
			const isEmpty = emptyCheck(value);
			expect(isEmpty).toBe(true);
		});

		it('if value is null', () => {
			const value = null;
			const isEmpty = emptyCheck(value);
			expect(isEmpty).toBe(true);
		});

		it('if value is empty string', () => {
			const value = '';
			const isEmpty = emptyCheck(value);
			expect(isEmpty).toBe(true);
		});
	});

	describe('should return false', () => {
		it('if value is 0', () => {
			const value = 0;
			const isEmpty = emptyCheck(value);
			expect(isEmpty).toBe(false);
		});

		it('if value is boolean false', () => {
			const value = false;
			const isEmpty = emptyCheck(value);
			expect(isEmpty).toBe(false);
		});
	});
});

describe('trimObject', () => {
	describe('should remove', () => {
		it('undefined value', () => {
			const args = { a: undefined, b: 'test' };
			const trimmed = trimObject(args);
			expect(trimmed).toEqual({ b: 'test' });
		});

		it('empty string', () => {
			const args = { a: '', b: 'test' };
			const trimmed = trimObject(args);
			expect(trimmed).toEqual({ b: 'test' });
		});

		it('null value', () => {
			const args = { a: null, b: 'test' };
			const trimmed = trimObject(args);
			expect(trimmed).toEqual({ b: 'test' });
		});

		it('empty values', () => {
			const args = { a: null, b: 'test', c: '', d: undefined };
			const trimmed = trimObject(args);
			expect(trimmed).toEqual({ b: 'test' });
		});
	});

	it('should sustain the constructor prototype', () => {
		const test = new Error();
		const trimmed = trimObject(test);
		expect(trimmed instanceof Error).toBe(true);
	});
});

describe('removeObjectKeys', () => {
	it('remove keys from object', () => {
		const obj = { a: 1, b: 2, c: 'test', 'more-complex': 'test' };
		const removeKeyList = ['a', 'more-complex'];
		const result = removeObjectKeys(obj)(removeKeyList);
		expect(result).toEqual({ b: 2, c: 'test' });
	});

	describe('should work correctly for', () => {
		it('empty input array', () => {
			const obj = { a: 1, b: 2, c: 'test', 'more-complex': 'test' };
			const removeKeyList = [];
			const result = removeObjectKeys(obj)(removeKeyList);
			expect(result).toEqual(obj);
		});

		it('array construction with emtpy array rest spread ', () => {
			const obj = { a: 1, b: 2, c: 'test', 'more-complex': 'test' };
			const removeKeyList = [...[], 'test', 'more-complex'];
			const result = removeObjectKeys(obj)(removeKeyList);
			expect(result).toEqual({ a: 1, b: 2, c: 'test' });
		});

		it('input array with empty string', () => {
			const obj = { a: 1, b: 2, c: 'test', 'more-complex': 'test' };
			const removeKeyList = [''];
			const result = removeObjectKeys(obj)(removeKeyList);
			expect(result).toEqual(obj);
		});
	});

	it('throw error if keys input is not an array', () => {
		const obj = { a: 1, b: 2, c: 'test', 'more-complex': 'test' };
		const removeKeyList = '';
		const wrongInput = () => removeObjectKeys(obj)(removeKeyList);
		expect(wrongInput).toThrowErrorMatchingSnapshot();
	});
});

describe('fieldStringToArray', () => {
	describe('output emtpy array if the input is', () => {
		it('emtpy string', () => {
			const fieldString = '';
			const result = fieldStringToArray(fieldString);
			expect(result).toEqual([]);
		});

		it('undefined', () => {
			const fieldString = undefined;
			const result = fieldStringToArray(fieldString);
			expect(result).toEqual([]);
		});
	});
});

describe('isPromise', () => {
	describe('return true if the input value', () => {
		it('is a Promise', () => {
			const a = Promise.resolve('test');
			const result = isPromise(a);
			expect(result).toBe(true);
		});

		it('returns a Promise', async () => {
			const a = jest.fn(() => Promise.resolve('test'));
			const call = a();
			const result = isPromise(call);
			expect(result).toBe(true);
			expect(call).not.toBe('test');
			expect(await call).toBe('test');
			expect(a.mock.calls).toHaveLength(1);
		});

		it('is an async function', async () => {
			const a = jest.fn(async () => 'test');
			const call = a();
			const result = isPromise(call);
			expect(result).toBe(true);
			expect(call).not.toBe('test');
			expect(await call).toBe('test');
			expect(a.mock.calls).toHaveLength(1);
		});
	});

	describe('return false if the input value', () => {
		it('is a sync function', () => {
			const a = jest.fn(() => 'test');
			const call = a();
			const result = isPromise(call);
			expect(result).toBe(false);
			expect(call).toBe('test');
		});
	});
});
