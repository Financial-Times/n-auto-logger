import { emptyCheck, trimObject, removeObjectKeys } from '../utils';

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
});
