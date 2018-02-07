# n-auto-logger [![CircleCI](https://circleci.com/gh/Financial-Times/n-auto-logger.svg?style=svg)](https://circleci.com/gh/Financial-Times/n-auto-logger) [![Coverage Status](https://coveralls.io/repos/github/Financial-Times/n-auto-logger/badge.svg?branch=master)](https://coveralls.io/github/Financial-Times/n-auto-logger?branch=master)
auto log (api) function calls with a single line of code

- [quickstart](#quickstart)
- [install](#install)
- [usage](#usage)
    * [error parsing and format](#error-parsing-and-format)
    * [function signature format](#function-signature-format)
    * [test stub](#test-stub)
- [before/after](#beforeafter)
- [development](#development)
- [todos](#todos)


## quickstart
```js
import logger, { autoLog, autoLogService, eventLogger } from '@financial-times/n-auto-logger';
```

```js
// auto log a function of its start, success/failure state 
// function name would be auto logged, e.g. `action=someFunction`
// * params, meta need to be Object so that values can be logged with key names
const result = autoLog(someFunction)(params, meta); // use await if it is an async function
```

```js
// auto log multiple functions wrapped in an object
const APIService = autoLogService{ methodA, methodB, methodC };
APIService.CallA(params, meta);
```

```js
// log operation and adhoc actions
const meta = { transactionId, userId, operation };
const event = eventLogger(meta);

try {
    event.action('someAction').success();
    event.success();
} catch(e) {
    event.failure(e);
}
```

```js
// set key names of fields to be muted in .env to reduce log for development
LOGGER_MUTE_FIELDS=transactionId, userId
```

## install
```shell
npm install @financial-times/n-auto-logger
```

## usage

### error parsing and format

`n-auto-logger` would parse different forms of the following error objects to logger-suitable format([detail](src/failure.js))
* Fetch Response Error
* Fetch (Network) Error
* Node Native Error Objects

> if you are parsing those errors to your customised object in error handling, `n-auto-logger` would pick up what's in the object automatically, but the object can't be an `instanceof Error`, otherwise extended fields would not be pickedup

### function signature format

To ensure auto log works correctly, `function (params: Object, meta?: Object)` format is required for function signature so that values can be logged with corresponding key names. `function (args: Object)` is also acceptable, if you would like to omit `meta` or put `meta` and `params` in one `args` Object.

Object destruction assignment is recommended `({ paramA, paramB }, { metaA, metaB }) => {}`.

The package would throw Errors if function signature is incorrect for `autoLog`

### test stub

```js
import logger from '@financial-times/n-auto-logger';

sandbox.stub(logger);
```

## before/after
```js
/* ---------------------- 
         BEFORE 
----------------------- */
/* some-api-service.js */
const methodA = async (params, meta) => {
    try {
        logger.info(params, meta, { action: 'methodA' });
        await fetch();
        logger.info(params, meta, { action: 'methodA', result: 'success' });
    } catch (e) {
        const error = parseErrorForLogger(e);
        logger.error(params, meta, { action: 'methodA', result: 'failure' }, error);
        //...
    }
}

const methodB = async (params, meta) => { /*similar amount of code for logger*/ };

export default { methodA, methodB };

/* some-controller-or-middleware.js */
const someFunctionForDataAB(dataA, dataB, meta) => {
    // ...logger.info({ dataA, dataB }, meta, { action: 'someFunctionForDataAB' });
    // ...logger.info({ dataA, dataB }, meta, { action: 'someFunctionForDataAB', result: 'success' });
    // ...logger.info({ dataA, dataB }, meta, { action: 'someFunctionForDataAB', result: 'failure' });
}

const meta = { transactionId, userId, operation };
logger.info(meta);

try {
    const dataA = await APIService.methodA(paramsA, meta);
    const dataB = await APIService.methodB(paramsB, meta);
    const dataC = someFunctionForDataAB(dataA, dataB, meta);
    if (dataC && dataC !== 'code block not in function') {
        logger.error(meta, { action: 'someCheckAction' }, { result: 'failure' });
        throw someException;
    }
    logger.error(meta, { action: 'someCheckAction' }, { result: 'success' });; // optional
    logger.error(meta, { result: 'failure' });
} catch(e) {
    // some error handling and parsing...
    logger.info(meta, { action: 'yourCallFunction' }, params, { result: 'failure' }, parsedError);
    // ...
    next(e);
}
```

```js
/* ---------------------- 
         AFTER
----------------------- */
/* some-api-service.js */
export default autoLogService({ methodA, methodB });

/* some-controller-or-middleware.js */
const meta = { transactionId, userId, operation };
const event = eventLogger(meta);

try {
    // ...
    const dataA = await APIService.methodA(paramsA, meta);
    const dataB = await APIService.methodB(paramsB, meta);
    const dataC = autoLog(someFunctionForDataAB)({ dataA, dataB }, meta);
    if (dataC && dataC !== 'code block not in function') {
        event.action('someCheckAction').failure();
        throw someException;
    }
    event.action('someCheckAction').success(); // optional
    event.success();
    // ...
} catch(e) {
    event.failure(e);
    // ...
    next(e);
}
```

## development
* `make install`
* `yarn test --watch` to automatically run test on changing src
* `yarn watch` to automatically correct code format on saving src

## todos
* consider adding a LoggerStandardError constructor to extend Error for custom Error types
* middleware/controller one-line enhancer
