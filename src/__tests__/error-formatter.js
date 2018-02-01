import fetch from 'node-fetch';
import nock from 'nock';
import {
	formatFetchResponseError,
	formatFetchNetworkError,
} from '../error-formatter';

describe('formatFetchResponseError', () => {
	it('format error in text/html contentType correctly', async () => {
		try {
			const response = await fetch('http://www.google.com/404');
			if (!response.ok) {
				throw response;
			}
		} catch (e) {
			const formatted = await formatFetchResponseError(e);
			expect(formatted).toMatchSnapshot();
		}
	});

	it('format error in text/plain contentType correctly', async () => {
		try {
			const response = await fetch('https://httpstat.us/403');
			if (!response.ok) {
				throw response;
			}
		} catch (e) {
			const formatted = await formatFetchResponseError(e);
			expect(formatted).toMatchSnapshot();
		}
	});

	it('format error in application/json contentType correctly', async () => {
		try {
			const response = await fetch('https://api.github.com', {
				method: 'POST',
			});
			if (!response.ok) {
				throw response;
			}
		} catch (e) {
			const formatted = await formatFetchResponseError(e);
			expect(formatted).toMatchObject({
				contentType: 'application/json; charset=utf-8',
				type: 'FETCH_RESPONSE_ERROR',
			});
			expect(formatted.content).toHaveProperty('documentation_url');
			expect(formatted.content).toHaveProperty('message');
		}
	});

	it('reports wrong response being threw to catch if response is ok', async () => {
		nock('https://somehost.com')
			.get('/posts')
			.reply(200);
		try {
			const response = await fetch('https://somehost.com/posts');
			throw response;
		} catch (e) {
			const formatted = await formatFetchResponseError(e);
			expect(formatted).toMatchSnapshot();
		}
	});
});

describe('formatFetchNetworkError', () => {
	it('format network error correctly', async () => {
		try {
			await fetch('https://mock.com');
		} catch (e) {
			const formatted = await formatFetchNetworkError(e);
			expect(formatted).toMatchSnapshot();
		}
	});
});
