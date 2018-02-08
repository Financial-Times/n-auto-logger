const CATEGORIES = {
	FETCH_RESPONSE_OK: 'FETCH_RESPONSE_OK',
	FETCH_RESPONSE_ERROR: 'FETCH_RESPONSE_ERROR',
	FETCH_NETWORK_ERROR: 'FETCH_NETWORK_ERROR',
};

// parse the response error based on content-type text/html, text/plain or application/json
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
// https://msdn.microsoft.com/en-us/library/ms526971(v=exchg.10).aspx
export const formatFetchResponseError = async response => {
	if (response.ok) {
		return {
			category: CATEGORIES.FETCH_RESPONSE_OK,
			status: response.status,
			message: "it shouldn't be caught as exception, please check the code",
		};
	}

	const { status, headers } = response;
	const contentType = headers.get('content-type');
	const parseMethod =
		contentType && contentType.includes('application/json') ? 'json' : 'text';
	const message = await response[parseMethod]();
	return {
		category: CATEGORIES.FETCH_RESPONSE_ERROR,
		contentType,
		status,
		message,
	};
};

export const formatFetchNetworkError = e => ({
	category: CATEGORIES.FETCH_NETWORK_ERROR,
	message: e.message,
	code: e.code,
});
