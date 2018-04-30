# n-auto-logger 

[![npm version](https://badge.fury.io/js/%40financial-times%2Fn-auto-logger.svg)](https://badge.fury.io/js/%40financial-times%2Fn-auto-logger)
![npm download](https://img.shields.io/npm/dm/@financial-times/n-auto-logger.svg)
![node version](https://img.shields.io/node/v/@financial-times/n-auto-logger.svg)


[![CircleCI](https://circleci.com/gh/Financial-Times/n-auto-logger.svg?style=shield)](https://circleci.com/gh/Financial-Times/n-auto-logger)
[![Coverage Status](https://coveralls.io/repos/github/Financial-Times/n-auto-logger/badge.svg?branch=master)](https://coveralls.io/github/Financial-Times/n-auto-logger?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/Financial-Times/n-auto-logger/badge.svg)](https://snyk.io/test/github/Financial-Times/n-auto-logger)
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/Financial-Times/n-auto-logger/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/Financial-Times/n-auto-logger/?branch=master)
[![Dependencies](https://david-dm.org/Financial-Times/n-auto-logger.svg)](https://david-dm.org/Financial-Times/n-auto-logger)
[![devDependencies](https://david-dm.org/Financial-Times/n-auto-logger/dev-status.svg)](https://david-dm.org/Financial-Times/n-auto-logger?type=dev)

auto log function calls in operation/action model with a single line of code, based on [n-logger](https://github.com/Financial-Times/n-logger)

<br>

- [quickstart](#quickstart)
  * [logAction](#logaction)
  * [logOperation](#logoperation)
  * [LOGGER_MUTE_FIELDS](#logger-mute-fields)
- [install](#install)
- [gotcha](#gotcha)
  * [default filtered fields](#default-filtered-fields)
  * [reserved field override](#reserved-field-override)
  * [test stub](#test-stub)
- [built-in](#built-in)
  * [out-of-box error parsing support](#out-of-box-error-parsing-support)
  * [clean up log object](#clean-up-log-object)
- [example](#example)
- [todos](#todos)

<br>

## quickstart

### logAction

automatically log the start, success/failure state with necessary metadata including function name as `action`, it can be applied to both individual action function or an action function bundle

```js
import { logAction } from '@financial-times/n-auto-logger';
// apply to individual action function
const result = logAction(someFunction)(params, meta);
// apply to action function bundle
export default logAction({ 
  methodA, 
  methodB, 
  methodC 
});
```

> more details on [action function](https://github.com/financial-Times/n-express-enhancer#action-function)

### logOperation

automatically log the start, success/failure state with necessary metadata including function name as `operation`, it can be applied to both individual operation function or an operation function bundle

```js
import { logOperation, toMiddleware } from '@financial-times/n-auto-logger';
// apply to operation function
const operationFunction = (meta, req, res) => { /* try-catch-throw */ };
const someMiddleware = compose(toMiddleware, logOperation)(operationFunction);
// apply to operation function bundle
export default compose(
  toMiddleware, 
  logOperation
)({ 
  operationFunctionA, 
  operationFuncitonB 
});
```

> more details on [operation function](https://github.com/financial-Times/n-express-enhancer#operatoin-function)

> more details on [chain with other enhancers](https://github.com/Financial-Times/n-express-enhancer/blob/master/README.md#chain-a-series-of-enhancers)

### LOGGER_MUTE_FIELDS

set key names of fields to be muted in .env to reduce log for development or filter fields in production

```js
LOGGER_MUTE_FIELDS=transactionId, userId
```

## install
```shell
npm install @financial-times/n-auto-logger
```

## gotcha

### default filtered fields
`user`, `handler`, `_locals` fields in `error` or `meta` object would not be logged by default.

```js
// sensitive personal data could be put in meta.user and would not be logged
const meta = { ...meta, user: { id, email } };

// UI but not debugger facing data could be put in error.user and would not be logged
// e.g. app error status (> API call error status), user message (> error message from API for debugging)
throw NError({ status, message }).extend({ user: { status, message } });
````
```js
// .handler field would not be logged, as it is only useful for error handler
throw nError({ status: 404 }).extend({ handler: 'REDIRECT_TO_INDEX' });
```
```js
// _locals field would not be logged as it is verbose and not relevant to debug
// in case you didn't clone the error object in error handler
function(err, req, res, next) {
  const e = {...err}; // clone the error object to avoid mutate the input
  res.render('template', e); // res.render is not a pure function, it would assign _locals to e
}
```

### reserved field override
`n-auto-logger` will append values to following reserved fields automatically, the values would be overriden by the key value of the same name in your `args/params/meta` or error object, be cautious not to override them unintentionally.
* `operation` default to `operationFunction.name`
* `service` default to name of the service the action belongs to if you are using [n-auto-metrics](https://github.com/Financial-Times/n-auto-metrics)
* `action` default to `callFunction.name`
* `category` default to `FETCH_RESPONSE_ERROR/FETCH_NETWORK_ERROR/NODE_SYSTEM_ERROR/CUSTOM_ERROR`
* `type` was used to specify the unique error type for debugging and error handling by convention
* `status` in error object would be recorded for service action call failure
* `stack` used in Error or NError to store the stack trace
* `result` default to `success/failure`

### test stub

stub the logger instance instead of the whole module

```js
import logger from '@financial-times/n-auto-logger'; // the underlying logger instance (`n-logger`)

// sinon sandbox
sandbox.stub(logger);

// jest
logger.info = jest.fn();
logger.warn = jest.fn();
logger.error = jest.fn();
```

## built-in

### out-of-box error parsing support

`n-auto-logger` would parse different forms of the following error objects to logger-suitable format automatically([detail](src/failure.js)), while it still logs plain object and string message.
* Fetch Response Error `content-type`:`application/json`,`text/plain`,`text/html`
* Fetch (Network) Error
* Node native Error objects
* Custom objects extends native Error object
* [NError](https://github.com/Financial-Times/n-error)

### clean up log object

`n-auto-logger` would trim any empty fields and method fields in the input meta or error objects automatically to concise log ([detail](src/index.js)), you shouldn't be concerned about passing excessive meta fields or extend Error object with methods.

## example
[enhanced api service example](https://github.com/Financial-Times/newspaper-mma/blob/master/server/apis/newspaper-info-svc.js)

[enhanced controller example](https://github.com/Financial-Times/newspaper-mma/blob/master/server/routes/delivery-address/controller.js)

## todos
* logger coverage measurement in test
