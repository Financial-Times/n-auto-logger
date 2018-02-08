import { Response, Headers, FetchError } from 'node-fetch';
import {
	formatFetchResponseError,
	formatFetchNetworkError,
	formatFetchError
} from '../error-formatter';

describe('formatFetchResponseError', () => {
	it('reports wrong response being threw to catch if response is ok', async () => {
		const headers = new Headers();
		headers.append('content-type', 'text/plain; charset=utf-8');
		const response = new Response('', { status: 200, headers });
		const formatted = await formatFetchResponseError(response);
		expect(formatted).toMatchSnapshot();
	});

	it('format error in text/html contentType correctly', async () => {
		const headers = new Headers();
		headers.append('content-type', 'text/html; charset=utf-8');
		const e = new Response('<html></html>', { status: 404, headers });
		const formatted = await formatFetchResponseError(e);
		expect(formatted).toMatchSnapshot();
	});

	it('format error in text/plain contentType correctly', async () => {
		const headers = new Headers();
		headers.append('content-type', 'text/plain; charset=utf-8');
		const e = new Response('403 Forbidden', { status: 403, headers });
		const formatted = await formatFetchResponseError(e);
		expect(formatted).toMatchSnapshot();
	});

	it('format error in application/json contentType correctly', async () => {
		const headers = new Headers();
		headers.append('content-type', 'application/json; charset=utf-8');
		const e = new Response(
			JSON.stringify({ message: 'some message', document: 'some url' }),
			{ status: 404, headers },
		);
		const formatted = await formatFetchResponseError(e);
		expect(formatted).toMatchSnapshot();
	});
});

describe('formatFetchNetworkError', () => {
	it('format network error correctly', async () => {
		const e = new FetchError(
			'request to https://mock.com/ failed, reason: unable to verify the first certificate',
		);
		e.code = 'UNABLE_TO_VERIFY_LEAF_SIGNATURE';
		const formatted = await formatFetchNetworkError(e);
		expect(formatted).toMatchSnapshot();
	});
});

describe('formatFetchError', () => {
	it('format response error correctly', async () => {
		const headers = new Headers();
		headers.append('content-type', 'text/plain; charset=utf-8');
		const e = new Response('403 Forbidden', { status: 403, headers });
		const formatted = await formatFetchError(e);
		expect(formatted).toMatchSnapshot();
	});

	it('format network error correctly', async () => {
		const e = new FetchError(
			'request to https://mock.com/ failed, reason: unable to verify the first certificate',
		);
		e.code = 'UNABLE_TO_VERIFY_LEAF_SIGNATURE';
		const formatted = await formatFetchError(e);
		expect(formatted).toMatchSnapshot();
	});

	it('does nothing on other error types e.g. System Error ', async () => {
		const e = new Error('some error message');
		const formatted = await formatFetchError(e);
		expect(formatted).toBe(e);
	});
});
