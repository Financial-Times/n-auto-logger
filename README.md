# n-auto-logger 

an [enhancer](https://github.com/Financial-Times/n-express-enhancer) to log function calls automatically with the operation/action model, based on [n-logger](https://github.com/Financial-Times/n-logger)

[![npm version](https://badge.fury.io/js/%40financial-times%2Fn-auto-logger.svg)](https://badge.fury.io/js/%40financial-times%2Fn-auto-logger)
![npm download](https://img.shields.io/npm/dm/@financial-times/n-auto-logger.svg)
![node version](https://img.shields.io/node/v/@financial-times/n-auto-logger.svg)


[![CircleCI](https://circleci.com/gh/Financial-Times/n-auto-logger.svg?style=shield)](https://circleci.com/gh/Financial-Times/n-auto-logger)
[![Coverage Status](https://coveralls.io/repos/github/Financial-Times/n-auto-logger/badge.svg?branch=master)](https://coveralls.io/github/Financial-Times/n-auto-logger?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/Financial-Times/n-auto-logger/badge.svg)](https://snyk.io/test/github/Financial-Times/n-auto-logger)
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/Financial-Times/n-auto-logger/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/Financial-Times/n-auto-logger/?branch=master)
[![Dependencies](https://david-dm.org/Financial-Times/n-auto-logger.svg)](https://david-dm.org/Financial-Times/n-auto-logger)
[![devDependencies](https://david-dm.org/Financial-Times/n-auto-logger/dev-status.svg)](https://david-dm.org/Financial-Times/n-auto-logger?type=dev)

<br>

- [Quickstart](#quickstart)
  * [logAction](#logaction)
  * [logOperation](#logoperation)
  * [addTransactionId](#addtransactionid)
  * [mute logger fields](#mute-logger-fields)
  * [auto log level](#auto-log-level)
- [Install](#install)
- [Gotcha](#gotcha)
  * [reserved fields](#reserved-fields)
  * [ignored fields](#ignored-fields)
  * [error auto parse](#error-auto-parse)
  * [log auto trim](#log-auto-trim)
  * [mute logger in test](#mute-logger-in-test)
- [Licence](#licence)

<br>

## Quickstart

### logAction

automatically log the start, success/failure state with necessary metadata including function name as `action`, it can be applied to both individual action function or an action function bundle.

```js
import { logAction, tagService, compose } from '@financial-times/n-auto-logger';

const result = logAction(someFunction)(params, meta); // action function

export default compose(
 tagService('service-name'), // optional
 logAction,
)({ 
 methodA, 
 methodB, 
 methodC 
}); // action function bundle
```

> more details on [action function](https://github.com/financial-Times/n-express-enhancer#action-function)

### logOperation

automatically log the start, success/failure state with necessary metadata including function name as `operation`, it can be applied to both individual operation function or an operation function bundle.

```js
import { logOperation, toMiddleware, compose } from '@financial-times/n-auto-logger';

const operationFunction = (meta, req, res) => {}; // operation function
const someMiddleware = compose(
 toMiddleware, 
 logOperation
)(operationFunction);

export default compose(
 toMiddleware, 
 logOperation
)({ 
 operationFunctionA, 
 operationFuncitonB 
}); // operation function bundle
```
> check [use res.render](https://github.com/Financial-Times/n-express-enhancer#use-resrender)

> more details on [operation function](https://github.com/financial-Times/n-express-enhancer#operatoin-function)

> more details on [chain with other enhancers](https://github.com/Financial-Times/n-express-enhancer/blob/master/README.md#chain-a-series-of-enhancers)

### addTransactionId

use the addTransactionId to ensure the logs are easy to thread when debugging, and this would work well with [n-api-factory](https://github.com/Financial-Times/n-api-factory) to pass it to up stream services.

```js
import { addTransactionId } from '@financial-times/n-auto-logger';

// you might want to exclude `__*` path from log
app.use(/^\/(?!_{2}).*$/, [
 // use it before any other middleware to be logged
 addTransactionId,
 //...other middlewares
]);
```

### mute logger fields

set key names of fields to be muted in .env to reduce log for development or filter fields in production.

```js
LOGGER_MUTE_FIELDS=transactionId, userId
```

### auto log level

set auto log level in `.env` with 3 options: `verbose`(default) | `concise` | `error`.

```js
AUTO_LOG_LEVEL=concise
```

* `verbose` would log every stage(start, success/failure) of operation and action
* `concise` would log success/failure of operation and only failure of action
* `error` would log only failure of operation and action

## Install
```shell
npm install @financial-times/n-auto-logger
```

## Gotcha

### reserved fields
`n-auto-logger` will append values to following reserved fields automatically, the values would be overriden by the key value of the same name in your `args/params/meta` or error object, be cautious not to override them unintentionally.

| fields    | default                                                                            | convention used in     |
|-----------|------------------------------------------------------------------------------------|------------------------|
| operation | operationFunction.name                                                             | n-auto-logger/metrics  |
| action    | actionFunction.name                                                                | n-auto-logger/metrics  |
| service   | tagService('service-name')                                                         | n-auto-metrics         |
| result    | 'success'<br>'failure'                                                                | n-auto-logger          |
| category  | 'FETCH_RESPONSE_ERROR'<br>'FETCH_NETWORK_ERROR'<br>'NODE_SYSTEM_ERROR'<br>'CUSTOM_ERROR' | n-auto-metrics/n-error |
| type      | specify the unique error type for debugging and error handling                     | n-auto-metrics/n-error |
| status    | recorded for service action call failure                                           | n-error/n-api-factory  |
| stack     | error stack trace                                                                  | n-error                |


### ignored fields
`user`, `handler`, `_locals` fields from `error` or `meta` object would not be logged by default.

sensitive personal data could be put in `meta.user` and would not be logged
```js
const meta = { ...meta, user: { id, email } };
```

UI but not debugger facing data could be put in `error.user` and would not be logged
e.g. app error status (> API call error status), user message (> error message from API for debugging)

```js
throw nError({ status, message }).extend({ user: { status, message } });
````

`.handler` field would not be logged, as it is only useful for error handler
```js
throw nError({ status: 404 }).extend({ handler: 'REDIRECT_TO_INDEX' });
```

`_locals` field would not be logged as it is verbose and not relevant to debug
```js
// in case you didn't clone the error object in error handler
function(err, req, res, next) {
  const e = {...err}; // clone the error object to avoid mutate the input
  res.render('template', e); // res.render is not a pure function, it would assign _locals to e
}
```

### error auto parse

`n-auto-logger` would parse different forms of the following error objects to logger-suitable format automatically([detail](src/failure.js)), while it still logs plain object and string message.

* Fetch Response Error `content-type`:`application/json`,`text/plain`,`text/html`
* Fetch (Network) Error
* Node native Error objects
* Custom objects extends native Error object
* [NError](https://github.com/Financial-Times/n-error)

### log auto trim

`n-auto-logger` would trim any empty fields and method fields in the input meta or error objects automatically to concise log ([detail](src/index.js)), you shouldn't be concerned about passing excessive meta fields or extend Error object with methods.

### mute logger in test

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

## Licence
[MIT](/LICENSE)
