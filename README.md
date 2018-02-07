# n-auto-logger [![CircleCI](https://circleci.com/gh/Financial-Times/n-auto-logger.svg?style=svg)](https://circleci.com/gh/Financial-Times/n-auto-logger) [![Coverage Status](https://coveralls.io/repos/github/Financial-Times/n-auto-logger/badge.svg?branch=master)](https://coveralls.io/github/Financial-Times/n-auto-logger?branch=master)
auto log (api) function calls with a single line of code

- [quickstart](#quickstart)
- [before/after](#before/after)
- [install](#install)
- [usage](#usage)
    * [function args format standard](#function-args-format-standard)
    * [exception/error format standard](#exception/error-format-standard)
    * [test stub](#test-stub)
- [development](#development)
- [todos](#todos)


## quickstart
```js
import logger, { autoLog, autoLogService, eventLogger } from '@financial-times/n-auto-logger';
```
auto log different status of a function call (commonly an action under an operation)
```js
const data = await autoLog(yourCallFunction)(params, meta);
const result = autoLog(someOtherFunction)(params, meta);
```
enhance all methods in api service module ensure that it would be logged wherever used
```js
/*-- some-api-service --*/
export default autoLogService{ CallA, CallB };

/*-- some-controller-or-middleware --*/
import APIService from 'some-api-service';

await APIService.CallA(params, meta);
await APIService.CallB(params, meta);
```
more strcutured operation/action log
```js
const meta = { transactionId, userId, operation };
const event = eventLogger(meta);

try {
    event.action('someAction').success();
    event.success();
} catch(e) {
    event.failure(e);
}

```
set key names of fields to be muted in .env to reduce log for development
```js
LOGGER_MUTE_FIELDS=transactionId, userId
```
## before/after
before
```js
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
after
```js
/* some-api-service.js */
export default autoLogService({ methodA, methodB });

/* some-controller-or-middleware.js */
const meta = { transactionId, userId, operation };
const event = eventLogger(meta);

try {
    // ...
    const dataA = await APIService.methodA(paramsA, meta);
    const dataB = await APIService.methodB(paramsB, meta);
    const dataC = autoLog(someFunctionForDataAB)(dataA, dataB);
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


## install
```shell
npm install @financial-times/n-auto-logger
```

## usage

### function args format standard

One opinionated pre-requisite is to have the callFunction input format as (params, meta) so that the callFunction can be invoked correctly with extra meta for logger

### exception/error

out-of-box parse support for the following standard types of errors
* Fetch Response Error
* Fetch (Network) Error
* Node Native Error Objects

> if your custom Error types are extended from native Error class, the logger might not be able to pick up custom information fields well, just use an object not constructed by Error

### test stub

```js
import * as nEventLogger from '@financial-times/n-auto-logger';

//example using sinon sandbox, will look into provide testStub as a module based on sinon/jest
const stubLoggerEvent = meta => ({
    // add more stubs to methods if you want
    start: () => null,
    success: () => null,
    failure: () => null,
    action: () => stubLoggerEvent(meta)
});
sandbox.stub(nEventLogger, 'loggerEvent').callsFake(stubLoggerEvent);
sandbox.stub(nEventLogger, 'autoLog').callsFake(
    callFunction => (params, meta) => callFunction(params, meta)
);
sandbox.stub(nEventLogger, 'autoLogService').callsFake(service => service);
```

## development
* `make install`
* `yarn test --watch` to automatically run test on changing src
* `yarn watch` to automatically correct code format on saving src

## todos
* middleware/controller one-line enhancer
* consider integrating `.addContext()` from `n-logger`
* consider add a LoggerStandardError constructor that supports error.stack
