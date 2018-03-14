# n-auto-logger 

[![npm version](https://badge.fury.io/js/%40financial-times%2Fn-auto-logger.svg)](https://badge.fury.io/js/%40financial-times%2Fn-auto-logger)

[![CircleCI](https://circleci.com/gh/Financial-Times/n-auto-logger.svg?style=shield)](https://circleci.com/gh/Financial-Times/n-auto-logger) [![Coverage Status](https://coveralls.io/repos/github/Financial-Times/n-auto-logger/badge.svg?branch=master)](https://coveralls.io/github/Financial-Times/n-auto-logger?branch=master) 
[![Known Vulnerabilities](https://snyk.io/test/github/Financial-Times/n-auto-logger/badge.svg)](https://snyk.io/test/github/Financial-Times/n-auto-logger) [![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/Financial-Times/n-auto-logger/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/Financial-Times/n-auto-logger/?branch=master) [![Dependencies](https://david-dm.org/Financial-Times/n-auto-logger.svg)](https://david-dm.org/Financial-Times/n-auto-logger)  [![devDependencies](https://david-dm.org/Financial-Times/n-auto-logger/dev-status.svg)](https://david-dm.org/Financial-Times/n-auto-logger?type=dev)

auto log function calls in operation/action model with a single line of code, based on [n-logger](https://github.com/Financial-Times/n-logger)

<br>

- [quickstart](#quickstart)
- [install](#install)
- [usage](#usage)
   * [action function format](#action-function-format)
   * [operation function format](#operation-function-format)
   * [use with other enhancers](#use-with-other-enhancers)
   * [default filtered fields](#default-filtered-fields)
   * [reserved filed override](#reserved-field-override)
   * [test stub](#test-stub)
- [built-in](#built-in)
   * [out-of-box error parsing support](#out-of-box-error-parsing-support)
   * [clean up log object](#clean-up-log-object)
- [example](#example)
- [development](#development)
- [todos](#todos)

<br>

## quickstart
```js
import { 
  autoLogAction, 
  autoLogActions, 
  autoLogOp,
  autoLogOps,
  toMiddleware,
  toMiddlewares,
} from '@financial-times/n-auto-logger';
```

```js
// auto log a function of its start, success/failure state with function name as `action`
const result = autoLogAction(someFunction)(args: Object, meta?: Object);

// auto log multiple functions wrapped in an object
const APIService = autoLogActions({ methodA, methodB, methodC });
```

> more details on [action function format](#action-function-format)

```js
// auto log an operation function of its start, success/failure state with function name as `operation`
const operationFunction = (meta, req, res, next) => { /* try-catch-next-throw */ };

const someMiddleware = compose(toMiddleware, autoLogOp)(operationFunction) 

// auto log multiple operation functions wrapped in an object as controller
const someController = compose(toMiddlewares, autoLogOps)({ operationFunctionA, operationFuncitonB });
```

> more details on [operation function format](#operation-function-format)

```js
// auto log operation and action together
const operationFunction = async (meta, req, res, next) => {
  try {
    // import the APIService enhanced by autoLogActions
    // `operationFunction.name` would be recorded in `meta` and passed down here
    const data = await APIService.methodA(params, meta);
    next();
  } catch(e) {
    next(e);
    throw e;
  }
};
export default toMiddleware(autoLogOp(operationFunction));
```

> more details on [use with other enhancers](#use-with-other-enhancers)

```js
// set key names of fields to be muted in .env to reduce log for development or filter fields in production
LOGGER_MUTE_FIELDS=transactionId, userId
```

## install
```shell
npm install @financial-times/n-auto-logger
```

## usage

### action function format

`n-auto-logger` allows two objects as the args of the autoLogged function so that values can be logged with corresponding key names.
```js
// you can auto log the call with meta, even if it is not mandatory to the function
const someFunction = ({ argsA, argsB }) => {};
autoLogAction(someFunction)(args, meta);
autoLogAction(someFunction)(argsAndMeta);

// if you need to pass certain meta in the function call
const someFunction = ({ paramsA, paramsB }, { metaA, metaB }) => {};

// if you need to do input params validation (e.g. before an API call)
const someFunction = (mandatory: Object, optional?: Object ={}) => {
  validate(mandatory);
  // ...
};
```

> The package would throw Errors if function signature is incorrect for `autoLogAction`.

### operation function format

The operation function use the pattern of `try-catch-next-throw`:

```js
const operationFunction = (meta, req, res, next) => {
  try{
    // main code
    // functions that can potentially throw errors
    // without the try-catch-next-throw pattern those errors may not be next to error handler
  } catch(e) {
      // ensure the error would be handled by the error handler, 
      // or you can write the error handling code in the catch block
      next(e);
      // further throw the error to the higher order enhancer function
      // error caught in the enhancer function would then be parsed and logged
      throw(e);
  }
}
```

### use with other enhancers

`autoLogOp` would return an operation function, so that other enhancers can be further chained before `toMiddleware`

```js
export default compose(toMiddleware, autoMetricsOp, autoLogOp)(operationFunction);
export default compose(toMiddlewares, autoMetricsOps, autoLogOps)(operationBundle);
export default compose(autoMetricsAction, autoLogAction)(callFunction);
export default compose(autoMetricsActions('service-name'), autoLogActions)(callFunctionBundle);
```

### default filtered fields
`user, handler, _locals` fields in `error` or `meta` object would not be logged by default.

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
* `stack` used in Error or NError to store the stack trace
* `result` default to `success/failure`

### test stub

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

## development
* `make install` or `yarn`
* `yarn test --watch` to automatically run test on changing src
* `yarn watch` to automatically correct code format on saving src

## todos
* minified output with webpack/uglify/prepack with dist/index.min.js tested, [bundlesize badge](https://unpkg.com/#/)
* logger coverage measurement in test
