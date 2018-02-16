# n-auto-logger [![CircleCI](https://circleci.com/gh/Financial-Times/n-auto-logger.svg?style=svg)](https://circleci.com/gh/Financial-Times/n-auto-logger) [![Coverage Status](https://coveralls.io/repos/github/Financial-Times/n-auto-logger/badge.svg?branch=master)](https://coveralls.io/github/Financial-Times/n-auto-logger?branch=master)
auto log (api) function calls with a single line of code, based on [n-logger](https://github.com/Financial-Times/n-logger)

<img height="180" src="http://78.media.tumblr.com/7ba12e3aa60cecb80ad00f11cb181dde/tumblr_inline_mjx5ioXh8l1qz4rgp.gif">

- [quickstart](#quickstart)
- [install](#install)
- [usage](#usage)
   * [function signature format](#function-signature-format)
   * [filter user field](#filter-user-field)
   * [test stub](#test-stub)
- [built-in](#built-in)
   * [out-of-box error parsing support](#out-of-box-error-parsing-support)
   * [trim empty fields](#trim-empty-fields)
- [example](#example)
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

> The package would throw Errors if function signature is incorrect for `autoLog`.

`(mandatory: Object, optional?: Object) => {}` is recommended in case you want to do params validation, while nullable params field/meta can be put in the second args.
```js
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

### filter user field
```js
// data under `user` field in meta wouldn't be logged, sensitive personal data could be put here
const meta = { operation, user: { id, email } };
const event = eventLogger(meta);

// data under `user` field in error wouldn't be logged, message to be rendered on UI could be put here
const error = { status, message, user: { message } };
event.failure(error);
````

### test stub

```js
import logger from '@financial-times/n-auto-logger'; // the underlying logger instance (`n-logger`)

sandbox.stub(logger);
```

## built-in

### out-of-box error parsing support

`n-auto-logger` would parse different forms of the following error objects to logger-suitable format automatically([detail](src/failure.js))
* Fetch Response Error `content-type`:`application/json`,`text/plain`,`text/html`
* Fetch (Network) Error
* Node Native Error Objects
* Custom Object extends Native Error Object

### trim empty fields

`n-auto-logger` would trim any empty fields in the input objects automatically to concise log ([detail](src/index.js)), you shouldn't be concerned about passing excessive meta fields.

## [example](EXAMPLE.md)

## development
* `make install`
* `yarn test --watch` to automatically run test on changing src
* `yarn watch` to automatically correct code format on saving src

## todos
* middleware/controller one-line enhancer
