# n-auto-logger 

a configurable logger [decorator](https://github.com/Financial-Times/n-express-enhancer) to automate function logs, compatible with [winston](https://github.com/winstonjs/winston), [n-logger](https://github.com/Financial-Times/n-logger), [n-mask-logger](https://github.com/financial-Times/n-mask-logger), etc.

> It has been consolidated into [n-express-monitor](https://github.com/financial-Times/n-express-monitor), please use that instead unless you're curious about things under the hood or want to customise your own tool chain

[![npm version](https://badge.fury.io/js/%40financial-times%2Fn-auto-logger.svg)](https://badge.fury.io/js/%40financial-times%2Fn-auto-logger)
![npm download](https://img.shields.io/npm/dm/@financial-times/n-auto-logger.svg)
![node version](https://img.shields.io/node/v/@financial-times/n-auto-logger.svg)
[![gitter chat](https://badges.gitter.im/Financial-Times/n-auto-logger.svg)](https://gitter.im/Financial-Times/n-auto-logger?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


[![CircleCI](https://circleci.com/gh/Financial-Times/n-auto-logger.svg?style=shield)](https://circleci.com/gh/Financial-Times/n-auto-logger)
[![Coverage Status](https://coveralls.io/repos/github/Financial-Times/n-auto-logger/badge.svg?branch=main)](https://coveralls.io/github/Financial-Times/n-auto-logger?branch=main)
[![Known Vulnerabilities](https://snyk.io/test/github/Financial-Times/n-auto-logger/badge.svg)](https://snyk.io/test/github/Financial-Times/n-auto-logger)
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/Financial-Times/n-auto-logger/badges/quality-score.png?b=main)](https://scrutinizer-ci.com/g/Financial-Times/n-auto-logger/?branch=main)
[![Dependencies](https://david-dm.org/Financial-Times/n-auto-logger.svg)](https://david-dm.org/Financial-Times/n-auto-logger)
[![devDependencies](https://david-dm.org/Financial-Times/n-auto-logger/dev-status.svg)](https://david-dm.org/Financial-Times/n-auto-logger?type=dev)

<br>

- [Install](#install)
- [Usage](#usage)
  * [plug in your logger](#plug-in-your-logger)
  * [decorate functions](#decorate-functions)
  * [thread the log](#thread-the-log)
  * [config log level](#config-log-level)
- [Gotcha](#gotcha)
  * [the Log](#the-log)
  * [the Meta](#the-meta)
  * [ignored fields](#ignored-fields)
  * [error auto parse](#error-auto-parse)
  * [test mock](#test-mock)
- [Licence](#licence)

<br>

## Install
```shell
npm i @financial-times/n-auto-logger --save
```

## Usage

### plug in your logger

```js
import { setupLoggerInstance } from '@financial-times/n-auto-logger';
import winston from 'winston'; // you can use any instance as long as it has .info, .warn, .error method

setupLoggerInstance(winston); // if logger instance not set, it would use n-logger by default
```

### decorate functions

A top level execution is categorised as an Operation, this can be an express middleware or controller function. Any lower level execution is categorised as an Action, and a two-level model of operation-action is encouraged.

With different log level settings, it would log the start, success/failure `status` of the function execution, function names to `scope` the operation/action, description of the `error` and params you need to `recreate` the error.

```js
import { compose, autoNext, logOperation } from '@financial-times/n-auto-logger';

const operation = (req, res) => {
  //let the error to be thrown
};

export default compose(
  autoNext,
  logOperation,
)(operation);
```

```js
import { logAction } from '@financial-times/n-auto-logger';

const action = (params: Object, meta: Object) => {}; // the function signature needs to follow the convention

export default logAction(action);
```
```js
const operation = ({ meta }, res, next) => {
  action(param, meta); // pass the meta object from req.meta to thread operation/action
  //...
};
```

> [want even less lines of code?](https://github.com/Financial-Times/n-express-enhancer#enhance-a-set-of-functions)

### thread the log

use the requestIdMiddleware to ensure the logs are easy to thread when debugging, and this would work well with [n-api-factory](https://github.com/Financial-Times/n-api-factory) to pass it to up stream services.

```js
import { requestIdMiddleware } from '@financial-times/n-auto-logger';

app.use([
 requestIdMiddleware, // use it before any decorated middleware
 //...decorated operation middlewares
]);
```

### config log level

auto log level can be set in ENV_VAR with 4 options: `verbose` | `standard`(default) | `concise` | `error`.

check the [example outputs](https://github.com/Financial-Times/next-monitor-express)

key names in meta can be ignored with settings in ENV_VAR to further concise log for specific cases

```js
LOGGER_MUTE_FIELDS=transactionId, userId
```

## Gotcha

### the Log

`threader`(requestId, userId)-`scope`(operation, action, service)-`status`(success/failure)-`error`(category, status)-`recreation`(params used in the function call)

based on the log, a brief next step guideline is as following:

* `NODE_SYSTEM_ERROR` would indicate implementation flaws in the system codebase
* `CUSTOM_ERROR` or 4XX `FETCH_RESPONSE_ERROR` would indicate known issues happening or validation/user journey flaws in the system
* 5XX `FETCH_RESPONSE_ERROR` would indicate issues potentially in the codebase of upstream systems
* `FETCH_NETWORK_ERROR` can be caused either by configuration in current system or upstream systems

### the Meta

An Meta object is used throughout operation(req.meta) and action(param, meta) to thread the status of functions and its context, the following conventional key names are used:

| fields    | default                                                                            | 
|-----------|------------------------------------------------------------------------------------|
| operation | operation function name                                                            |
| action    | action function name                                                               |
| service   | api client action bundle service name, use [monitorService](https://github.com/Financial-Times/n-express-monitor#monitorservice) |
| result    | 'success'<br>'failure'                                                             |
| category  | 'FETCH_RESPONSE_ERROR'<br>'FETCH_NETWORK_ERROR'<br>'NODE_SYSTEM_ERROR'<br>'CUSTOM_ERROR' |
| type      | specify the unique error type for debugging and error handling                     |
| status    | recorded for service action call failure                                           |
| stack     | error stack trace (can be ignored, as operation/action should have help you locate the scope)    |


### ignored fields
`user`, `handler` fields from `error` or `meta` object would not be logged.

User facing error message can be included in `error.user` to decouple the user and debug message

```js
throw nError({ status, message }).extend({ user: { status, message } });
````

`.handler` field would not be logged, as it is only useful for error handler
```js
throw nError({ status: 404 }).extend({ handler: 'REDIRECT_TO_INDEX' });
```

### error auto parse

`n-auto-logger` would parse different forms of the following error objects to logger-suitable format automatically([detail](src/failure.js)), while it still logs plain object and string message.

* Fetch Response Error `content-type`:`application/json`,`text/plain`,`text/html`
* Fetch (Network) Error
* Node native Error objects
* Custom objects extends native Error object
* [NError](https://github.com/Financial-Times/n-error)


### test mock

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
