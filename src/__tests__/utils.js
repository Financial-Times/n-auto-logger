import { emptyCheck, trimObject, removeObjectKeys, isPromise } from '../utils';

describe('emptyCheck', () => {
	it('should return true if value is undefined', () => {
		const value = undefined;
		const isEmpty = emptyCheck(value);
		expect(isEmpty).toBe(true);
	});

	it('should return true if value is null', () => {
		const value = null;
		const isEmpty = emptyCheck(value);
		expect(isEmpty).toBe(true);
	});

	it('should return true if value is empty string', () => {
		const value = '';
		const isEmpty = emptyCheck(value);
		expect(isEmpty).toBe(true);
	});

	it('should return false if value is 0', () => {
		const value = 0;
		const isEmpty = emptyCheck(value);
		expect(isEmpty).toBe(false);
	});

	it('should return false if value is boolean false', () => {
		const value = false;
		const isEmpty = emptyCheck(value);
		expect(isEmpty).toBe(false);
	});
});

describe('trimObject', () => {
	it('should remove undefined value', () => {
		const args = { a: undefined, b: 'test' };
		const trimmed = trimObject(args);
		expect(trimmed).toMatchObject({ b: 'test' });
	});

	it('should remove empty string', () => {
		const args = { a: '', b: 'test' };
		const trimmed = trimObject(args);
		expect(trimmed).toMatchObject({ b: 'test' });
	});

	it('should remove null value', () => {
		const args = { a: null, b: 'test' };
		const trimmed = trimObject(args);
		expect(trimmed).toMatchObject({ b: 'test' });
	});

	it('should remove empty values', () => {
		const args = { a: null, b: 'test', c: '', d: undefined };
		const trimmed = trimObject(args);
		expect(trimmed).toMatchObject({ b: 'test' });
	});
});

describe('removeObjectKeys', () => {
	it('remove keys from object', () => {
		const obj = { a: 1, b: 2, c: 'test', 'more-complex': 'test' };
		const removeKeyList = ['a', 'more-complex'];
		const result = removeObjectKeys(obj)(removeKeyList);
		expect(result).toMatchObject({ b: 2, c: 'test' });
	});

	it('works correctly for empty input array', () => {
		const obj = { a: 1, b: 2, c: 'test', 'more-complex': 'test' };
		const removeKeyList = [];
		const result = removeObjectKeys(obj)(removeKeyList);
		expect(result).toMatchObject(obj);
	});

	it('throw error if keys input is not an array', () => {
		const obj = { a: 1, b: 2, c: 'test', 'more-complex': 'test' };
		const removeKeyList = '';
		const wrongInput = () => removeObjectKeys(obj)(removeKeyList);
		expect(wrongInput).toThrow();
	});
});

describe('isPromise', () => {
	it('return true if the passing value is a Promise', () => {
		const a = Promise.resolve('test');
		const result = isPromise(a);
		expect(result).toBe(true);
	});

	it('return true if the passing value returns a Promise', async () => {
		const a = jest.fn(() => Promise.resolve('test'));
		const call = a();
		const result = isPromise(call);
		expect(result).toBe(true);
		expect(call).not.toBe('test');
		expect(await call).toBe('test');
		expect(a.mock.calls).toHaveLength(1);
	});

	it('return true if the passing value is an async function', async () => {
		const a = jest.fn(async () => 'test');
		const call = a();
		const result = isPromise(call);
		expect(result).toBe(true);
		expect(call).not.toBe('test');
		expect(await call).toBe('test');
		expect(a.mock.calls).toHaveLength(1);
	});

	it('return false if the passing value is a sync function', () => {
		const a = jest.fn(() => 'test');
		const call = a();
		const result = isPromise(call);
		expect(result).toBe(false);
		expect(call).toBe('test');
	});
});
