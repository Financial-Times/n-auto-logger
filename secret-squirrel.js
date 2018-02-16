module.exports = {
	files: {
		allow: [
			'.gitattributes',
			'src/__tests__/__snapshots__/failure.js.snap',
			'src/__tests__/__snapshots__/index.js.snap',
			'src/__tests__/__snapshots__/utils.js.snap',
			'yarn.lock',
		],
		allowOverrides: [],
	},
	strings: {
		deny: [],
		denyOverrides: [
			'7ba12e3aa60cecb80ad00f11cb181dde', // README.md:4|4
		],
	},
};
