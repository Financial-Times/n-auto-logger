import { fieldStringToArray } from '../utils';

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
