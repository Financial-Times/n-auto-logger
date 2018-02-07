# n-auto-logger [![CircleCI](https://circleci.com/gh/Financial-Times/n-auto-logger.svg?style=svg)](https://circleci.com/gh/Financial-Times/n-auto-logger) [![Coverage Status](https://coveralls.io/repos/github/Financial-Times/n-auto-logger/badge.svg?branch=master)](https://coveralls.io/github/Financial-Times/n-auto-logger?branch=master)
auto log (api) function calls with a single line of code

- [quickstart](#quickstart)
- [install](#install)
- [usage](#usage)
    * [function signature format](#function-signature-format)
    * [error parsing and format](#error-parsing-and-format)
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
// * if there's key name `action` in args/params/meta, its value would override the above
// * args or params/meta need to be Object so that values can be logged with key names
const result = autoLog(someFunction)(args); // combined `params` and `meta` in one object `args`
const result = autoLog(someFunction)(params, meta); // if you care to seperate `params` and `meta`
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

### function signature format

Both `(args: Object) => {}` and `(params: Object, meta?: Object) => {}` would work, and destructing assignment is recommended `({ paramA, paramB }, { metaA, metaB }) => {}`.

The package would throw Errors if function signature is incorrect for `autoLog`.

> `(mandatory: Object, optional?: Object) => {}` is recommended in case you want to do params validation, while nullable params field/meta can be put in the second args.
```
const someFunction = (mandatory, optional) => {
   try {
      validate(mandatory); // throw error before continue for e.g. API call
      // ...
   } catch (e) {
      // ...
   }
};

autoLog(someFunction)(mandatory, optional);
```

### error parsing and format

`n-auto-logger` would parse different forms of the following error objects to logger-suitable format([detail](src/failure.js))
* Fetch Response Error
* Fetch (Network) Error
* Node Native Error Objects
* Custom Object extends Native Error Object

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
* middleware/controller one-line enhancer
