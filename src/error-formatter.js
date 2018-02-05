// parse the response error based on content-type text/html, text/plain or application/json
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
// https://msdn.microsoft.com/en-us/library/ms526971(v=exchg.10).aspx
export const formatFetchResponseError = async response => {
	if (response.ok) {
		return {
			status: response.status,
			message:
				"FETCH_RESPONSE_OK - it shouldn't be caught as exception, please check the code",
		};
	}

	const { status, headers } = response;
	const contentType = headers.get('content-type');
	const parseMethod =
		contentType && contentType.includes('application/json') ? 'json' : 'text';
	const message = await response[parseMethod]();
	return {
		status,
		contentType,
		message,
	};
};

export const formatFetchNetworkError = e => ({
	message: e.message,
	code: e.code,
});
