export function LoggerStandardError(fields) {
	if (!(this instanceof LoggerStandardError)) {
		const obj = Object.create(LoggerStandardError.prototype);
		return Object.assign(obj, fields);
	}
	Object.keys(fields).forEach(key => {
		this[key] = fields[key];
	});
	return this;
}

// parse the response error based on content-type text/html, text/plain or application/json
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
// https://msdn.microsoft.com/en-us/library/ms526971(v=exchg.10).aspx
export const formatFetchResponseError = async response => {
	if (response.ok) {
		return LoggerStandardError({
			category: 'FETCH_RESPONSE_OK',
			status: response.status,
			message: "it shouldn't be caught as exception, please check the code",
		});
	}

	const { status, headers } = response;
	const contentType = headers.get('content-type');
	const parseMethod =
		contentType && contentType.includes('application/json') ? 'json' : 'text';
	const message = await response[parseMethod]();
	return LoggerStandardError({
		category: 'FETCH_RESPONSE_ERROR',
		status,
		contentType,
		message,
	});
};

export const formatFetchNetworkError = e =>
	LoggerStandardError({
		category: 'FETCH_NETWORK_ERROR',
		message: e.message,
		code: e.code,
	});
