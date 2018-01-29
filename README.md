# n-event-logger
log all your API service calls and function calls with a single line of code

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

### further streamline structuring your log

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
