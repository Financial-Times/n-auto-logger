<img height="180" align="right" src="http://78.media.tumblr.com/7ba12e3aa60cecb80ad00f11cb181dde/tumblr_inline_mjx5ioXh8l1qz4rgp.gif"><br><br>

# n-auto-logger [![CircleCI](https://circleci.com/gh/Financial-Times/n-auto-logger.svg?style=shield)](https://circleci.com/gh/Financial-Times/n-auto-logger) [![Coverage Status](https://coveralls.io/repos/github/Financial-Times/n-auto-logger/badge.svg?branch=master)](https://coveralls.io/github/Financial-Times/n-auto-logger?branch=master)
auto log (api) function calls with a single line of code, based on [n-logger](https://github.com/Financial-Times/n-logger)

<br>

- [quickstart](#quickstart)
- [install](#install)
- [usage](#usage)
   * [function signature format](#function-signature-format)
   * [filter user field](#filter-user-field)
   * [reserved filed override](#reserved-field-override)
   * [test stub](#test-stub)
- [built-in](#built-in)
   * [out-of-box error parsing support](#out-of-box-error-parsing-support)
   * [trim empty fields](#trim-empty-fields)
- [example](#example)
- [development](#development)
- [todos](#todos)

<br>

## quickstart
```js
import logger, { autoLog, autoLogService, eventLogger } from '@financial-times/n-auto-logger';
```

```js
// auto log a function of its start, success/failure state with function name as `action`
const result = autoLog(someFunction)(args: Object, meta?: Object);
```
> more details on [function signature format](#function-signature-format)

```js
// auto log multiple functions wrapped in an object
const APIService = autoLogService{ methodA, methodB, methodC };
APIService.CallA(params, meta);
```

```js
// set key names of fields to be muted in .env to reduce log for development
LOGGER_MUTE_FIELDS=transactionId, userId
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

## install
```shell
npm install @financial-times/n-auto-logger
```

## usage

### function signature format

`n-auto-logger` allows two objects as the args of the autoLogged function so that values can be logged with corresponding key names.
```js
// you can auto log the call with meta, even if it is not mandatory to the function
const someFunction = ({ argsA, argsB }) => {};
autoLog(someFunction)(args, meta);
autoLog(someFunction)(argsAndMeta);

// if you need to pass certain meta in the function call
const someFunction = ({ paramsA, paramsB }, { metaA, metaB }) => {};

// if you need to do input params validation (e.g. before an API call)
const someFunction = (mandatory: Object, optional?: Object ={}) => {
  validate(mandatory);
  // ...
};
```

> The package would throw Errors if function signature is incorrect for `autoLog`.

### filter user field
```js
// data under `user` field in meta wouldn't be logged, sensitive personal data could be put here
const meta = { operation, user: { id, email } };
const event = eventLogger(meta);

// data under `user` field in error wouldn't be logged, message to be rendered on UI could be put here
const error = { status, message, user: { message } };
event.failure(error);

// both the above filter built-in
const someFunction = (args, { metaA, user }) => {
  try {
    //...
    someCall(user);
    //...
  } catch (e) {
    e.user = { message: 'some message to be displayed on UI' };
    throw e;
  }
}
autoLog(someFunction)(args, meta);
````

### reserved field override
`n-auto-logger` will append values to following reserved fields automatically, the values would be overriden by the key value of the same name in your `args/params/meta`
* `action` default to `callFunction.name`
* `category` default to `FETCH_RESPONSE_ERROR/FETCH_NETWORK_ERROR/NODE_SYSTEM_ERROR/CUSTOM_ERROR`

### test stub

```js
import logger from '@financial-times/n-auto-logger'; // the underlying logger instance (`n-logger`)

sandbox.stub(logger);
```

## built-in

### out-of-box error parsing support

`n-auto-logger` would parse different forms of the following error objects to logger-suitable format automatically([detail](src/failure.js)), while it still logs plain object and string message.
* Fetch Response Error `content-type`:`application/json`,`text/plain`,`text/html`
* Fetch (Network) Error
* Node Native Error Objects
* Custom Object extends Native Error Object

### trim empty fields

`n-auto-logger` would trim any empty fields in the input objects automatically to concise log ([detail](src/index.js)), you shouldn't be concerned about passing excessive meta fields.

## example
[example](example/EXAMPLE.md)

## development
* `make install` or `yarn`
* `yarn test --watch` to automatically run test on changing src
* `yarn watch` to automatically correct code format on saving src

## todos
* middleware/controller one-line enhancer
