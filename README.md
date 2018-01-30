# n-event-logger [![CircleCI](https://circleci.com/gh/Financial-Times/n-event-logger.svg?style=svg)](https://circleci.com/gh/Financial-Times/n-event-logger)
log all your API service calls and function calls with a single line of code

- [brief](#install)
- [install](#install)
- [usage](#usage)
    * [enhance a single API service call](#enhance-a-single-api-service-call)
    * [enhance a whole series of API service call](#enhance-a-whole-series-of-api-service-call)
    * [log your operation in structure with loggerEvent](#log-your-operation-in-structure-with-loggerevent)
    * [auto log non-api-service function with withLogger enhancer](#auto-log-non-api-service-function-with-withlogger-enhancer)
    * [track some non-api-service function on the fly](#track-some-non-api-service-function-on-the-fly)
    * [test stub](#test-stub)
- [development](#development)
- [todos](#todos)


## brief
```javascript
import { withLogger } from '@financial-times/n-event-logger';

await withLogger(meta)(yourCallFunction)(params, meta);
```
```javascript
import { withServiceLogger } from '@financial-times/n-event-logger';

export default withServiceLogger{
    apiServiceCallA,
    apiServiceCallB,
};

/* ... */

await APIService.apiServiceCallA(params, meta);
await APIService.apiServiceCallB(params, meta);

```
```javascript
import { eventLogger } from '@financial-times/n-event-logger';

const meta = { transactionId, userId, operation };

const event = eventLogger(meta);

try {
    event.action('someAction').success();
    /* ... */
    event.success();
    /* ... */
} catch(e) {
    event.failure(e);
    /* ... */
}

```
```javascript
// set key names of fields to be muted in .env to reduce log for development
LOGGER_MUTE_FIELDS=transactionId, userId
``` 

## install
```shell
npm install @financial-times/n-event-logger
```

## usage

### enhance a single API service call

```javascript
/*
    One opinionated pre-requisite is to have the callFunction input format as (params, meta) so that the callFunction can be invoked correctly with extra meta for logger
 */

/*-- api-service.js --*/
import { withLogger } from '@financial-times/n-event-logger';

export const callSomeAPIService = (params, meta) => {
    const options = {
        headers: {
            /* some meta data specific headers... */
        }
    };

    /* maybe some code before fetch... */

    return fetch(url, options)
        .then(/* some code for response... */)
        .catch(/* some error hanlding... */);
}

// this would record the name of the function 'callSomeAPIService' as action in the logger automatically
export const enhancedCallSomeAPIService = (params, meta) => withLogger(meta)(callSomeAPIService)(params, meta);

/*
    currently async/await is needed for the logger to work correctly, update coming soon
 */

/*-- middleware/controller.js --*/
import { enhancedCallSomeAPIService } from '../api-service';

const someOperationFunction = async (req, res, next) => {
    const meta = {
        /* some fields for headers */
        transactionId: req.transactionId,
        /* extra fields for loggers */
        operation: 'someOperation',
        userId: req.userId,
    };

    try{
        await enhancedCallSomeAPIService(params, meta);
    } catch (e) {
        next(e);
    }
}
```
---

> info: transactionId: xxxx-xxx, userId: xxxx-xxx, operatoin: someOperation, action: callSomeAPIService

> info: transactionId: xxxx-xxx, userId: xxxx-xxx, operatoin: someOperation, action: callSomeAPIService, status: success

---

depends on the error status code, it would log as warn for 4XX, and error for 5XX

> warn: transactionId: xxxx-xxx, userId: xxxx-xxx, operatoin: someOperation, action: callSomeAPIService, status: failure, message: some error message

> error: transactionId: xxxx-xxx, userId: xxxx-xxx, operatoin: someOperation, action: callSomeAPIService, status: failure, message: some error message

### enhance a whole series of API service call

```javascript
/*-- api-service.js --*/
import { withServiceLogger } from '@financial-times/n-event-logger';

export const apiServiceCallA = (params, meta) => {}
export const apiServiceCallB = (params, meta) => {}

// helper to enhance all API service call functions as object methods
export default withServiceLogger{
    apiServiceCallA,
    apiServiceCallB
};

/*-- middleware/controller.js --*/
import SomeAPIService from '../some-api-service';

const someOperationFunction = async (req, res, next) => {
    const meta = {
        transactionId: req.transactionId,
        userId: req.userId,
        operation: 'someOperation',
    };

    try{
        await someAPIService.apiServiceCallA(params, meta);
        await someAPIService.apiServiceCallB(params, meta);
    } catch (e) {
        next(e);
    }
}
```

### log your operation in structure with loggerEvent

```javascript
/*-- middleware/controller.js --*/
import { loggerEvent } from '@financial-times/n-event-logger';
import SomeAPIService from '../some-api-service';

const someOperationFunction = async (req, res, next) => {
    const meta = {
        transactionId: req.transactionId,
        userId: req.userId,
        operation: 'someOperation',
    };
    const event = loggerEvent(meta);

    try{
        const a = await someAPIService.apiServiceCallA(params, meta);
        const b = await someAPIService.apiServiceCallB(params, meta);
        /* some other code... */
        const c = someFunction(a, b);
        event.success({ c });
        /* some other code... */
    } catch (e) {
        event.failure(e);
        next(e);
    }
}
```

---

> info: transactionId: xxxx-xxx, userId: xxxx-xxx, operatoin: someOperation

> ... some more process info log from various actions

> info: transactionId: xxxx-xxx, userId: xxxx-xxx, operatoin: someOperation, status: success, data: { "c": 'values are stringified JSON' }

---

> info: transactionId: xxxx-xxx, userId: xxxx-xxx, operatoin: someOperation

> ... some more process info log from various actions

> error: transactionId: xxxx-xxx, userId: xxxx-xxx, operatoin: someOperation, action: apiServiceCallB, result: failure, message: "some message"

> error: transactionId: xxxx-xxx, userId: xxxx-xxx, operatoin: someOperation, status: failure, message: "error message"

logs help you track down exactly which function call leads to the operation failure with what params in call in what context

---

### auto log non-api-service function with withLogger enhancer
```javascript
import { loggerEvent, withLogger } from '@financial-times/n-event-logger';

const someFunction = (a, b) => {
    try {
        /* some code... */
        return c;
    } catch(e) {
        /* some error handling... */
        // function needs to throw error or return Promise.reject() for failure status to be logged
        throw e;
    }
}

const someOperationFunction = async (req, res, next) => {
    const meta = {
        transactionId: req.transactionId,
        userId: req.userId,
        operation: 'someOperation',
    };
    const event = loggerEvent(meta);

    try{
        const a = await someAPIService.apiServiceCallA(params, meta);
        const b = await someAPIService.apiServiceCallB(params, meta);
        /* some other code... */
        // await is needed for the result status logger to work correctly
        const c = await withLogger(meta)(someFunction)(a, b);
        event.success({ c });
        /* some other code... */
    } catch (e) {
        event.failure(e);
        next(e);
    }
}
```

### track some non-api-service function on the fly

```javascript
/*-- middleware/controller.js --*/
const someOperationFunction = async (req, res, next) => {
    const meta = {
        transactionId: req.transactionId,
        userId: req.userId,
        operation: 'someOperation',
    };
    const event = loggerEvent(meta);

    try{
        const a = await someAPIService.apiServiceCallA(params, meta);
        const b = await someAPIService.apiServiceCallB(params, meta);
        /* some other code... */
        if(someCondition && someCheck){
            event.action('someAction').success();
        } else {
            event.action('someAction').failure();
            throw ;
        }
        /* some other code... */
        event.success();
        /* some other code... */
    } catch (e) {
        event.failure(e);
        next(e);
    }
}
```

### test stub

```javascript
import * as nEventLogger from '@financial-times/n-event-logger';

//example using sinon sandbox, will look into provide testStub as a module based on sinon/jest
const stubLoggerEvent = meta => ({
    // add more stubs to methods if you want
    start: () => null,
    success: () => null,
    failure: () => null,
    action: () => stubLoggerEvent(meta)
});
sandbox.stub(nEventLogger, 'loggerEvent').callsFake(stubLoggerEvent);
sandbox.stub(nEventLogger, 'withLogger').callsFake(
    meta => callFunction => args => callFunction(args, meta)
);
sandbox.stub(nEventLogger, 'withServiceLogger').callsFake(service => service);
```

## development
* `make install`
* `yarn test --watch` to automatically run test on changing src
* `yarn watch` to automatically correct code format on saving src

## todos
* middleware/controller one-line enhancer
* consider integrating `.addContext()` from `n-logger`
