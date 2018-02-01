// parse the response error based on content-type text/html, text/plain or application/json
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
// https://msdn.microsoft.com/en-us/library/ms526971(v=exchg.10).aspx
export const formatFetchResponseError = async response => {
	if (response.ok) {
		return {
			type: 'FETCH_RESPONSE_OK',
			status: response.status,
			message: "it shouldn't be caught as exception, please check the code",
		};
	}

	const { status, headers } = response;
	const contentType = headers.get('content-type');
	// TODO: consider JSON.stringify the parsed detail object from json()?
	// if the logger can't log a nested object correctly
	const parseMethod =
		contentType && contentType.includes('application/json') ? 'json' : 'text';
	const content = await response[parseMethod]();
	return {
		type: 'FETCH_RESPONSE_ERROR',
		status,
		contentType,
		content,
	};
};

export const formatFetchNetworkError = e => ({
	type: 'FETCH_NETWORK_ERROR',
	message: e.message,
	code: e.code,
});
