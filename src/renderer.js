/* istanbul ignore next */
const enhancedRender = (req, res, next) => {
	const originalRender = res.render;
	res.render = function render(...args) {
		originalRender.apply(this, args);
		res.rendered = true;
	};
	next();
};

export default enhancedRender;
