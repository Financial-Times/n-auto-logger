node_modules/@financial-times/n-gage/index.mk:
	npm install --no-save @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk

build: $(shell find src -type f)
	@echo "Building…"
	@rm -rf dist
	@babel src -d dist --ignore '**/__tests__/*.js'

unit-test:
	@echo "Unit Testing…"
	@jest

lint:
	@echo 'linting…'
	@eslint src

test: verify lint unit-test