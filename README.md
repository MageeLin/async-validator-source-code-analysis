# async-validator

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![node version][node-image]][node-url]
[![npm download][download-image]][download-url]
[![npm bundle size (minified + gzip)][bundlesize-image]][bundlesize-url]

[npm-image]: https://img.shields.io/npm/v/async-validator.svg?style=flat-square
[npm-url]: https://npmjs.org/package/async-validator
[travis-image]: https://img.shields.io/travis/yiminghe/async-validator.svg?style=flat-square
[travis-url]: https://travis-ci.org/yiminghe/async-validator
[coveralls-image]: https://img.shields.io/coveralls/yiminghe/async-validator.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/yiminghe/async-validator?branch=master
[node-image]: https://img.shields.io/badge/node.js-%3E=4.0.0-green.svg?style=flat-square
[node-url]: https://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/async-validator.svg?style=flat-square
[download-url]: https://npmjs.org/package/async-validator
[bundlesize-image]: https://img.shields.io/bundlephobia/minzip/async-validator.svg?label=gzip%20size
[bundlesize-url]: https://bundlephobia.com/result?p=async-validator

## 内容介绍

本仓库 fork 自[async-validator](https://github.com/yiminghe/async-validator)的`master`分支，`commitID`为`8e17b30`。翻译了 README 文档，并解析了源代码。

## 代码结构

代码结构如下所示：

![代码结构图](https://raw.githubusercontent.com/MageeLin/async-validator-source-code-analysis/37c0ca0dcc4845ba4f5f526f6b27debf72bd9c84/src/async-validator.svg)

异步表单验证。参考自 https://github.com/freeformsystems/async-validate


## 安装

```bash
npm i async-validator
```

## 使用方法

基本的使用方法：定义一个 `descriptor`，将其分配给一个 `schema`，并将要验证的 `object` 以及一个`回调函数`传递给该 `schema` 的`validate`方法：

```js
import Schema from 'async-validator';
const descriptor = {
  name: {
    type: 'string',
    required: true,
    validator: (rule, value) => value === 'muji',
  },
  age: {
    type: 'number',
    asyncValidator: (rule, value) => {
      return new Promise((resolve, reject) => {
        if (value < 18) {
          reject('too young'); // reject 这个 error message
        } else {
          resolve();
        }
      });
    },
  },
};
const validator = new Schema(descriptor);
validator.validate({ name: 'muji' }, (errors, fields) => {
  if (errors) {
    // 校验失败，errors是一个包含所有error的数组。
    // fields是一个对象，对象中field（字段）是key，每个field对应的所有error组成的数组是value。
    return handleErrors(errors, fields);
  }
  // 校验通过
});

// PROMISE使用方法
validator
  .validate({ name: 'muji', age: 16 })
  .then(() => {
    // 校验通过或者没有error message
  })
  .catch(({ errors, fields }) => {
    return handleErrors(errors, fields);
  });
```

## API

### Validate

```js
function(source, [options], callback): Promise
```

- `source`: 需要校验的对象（必选）。
- `options`: 描述校验的处理选项的对象（可选）。
- `callback`: 当校验完成时调用的回调函数（必选）。

该方法将返回一个 Promise 对象，如下:

- `then()`，校验通过
- `catch({ errors, fields })`，校验失败，errors 是一个所有 error 组成的数组；field 是一个对象，键是 field，值是对应的 errors 数组。

### Options

- `suppressWarning`: Boolean，指示是否取消关于无效值的内部警告。

- `first`: Boolean，当第一个校验规则产生`error`时调用`callback`，不再继续处理校验规则。如果校验涉及多个异步调用（例如数据库查询） ，且只需要第一个`error`出现时就停止，则使用此选项。

- `firstFields`: Boolean|String[], 当指定字段的第一个校验规则产生`error`时调用`callback`，不再继续处理相同字段的校验规则。`true`意味着所有字段生效。

### Rules

Rules 可能是执行校验的函数。

```js
function(rule, value, callback, source, options)
```

- `rule`: 在源`descriptor`中，与要校验的字段名称相对应的校验规则。始终为它分配一个`field`属性，其中包含要验证的字段的名称。
- `value`: 源对象属性中要校验的值。
- `callback`: 校验完成后要调用的`callback`。它期望传递一个`Error`实例数组以指示校验失败。如果校验是同步的，则可以直接返回`false`、`Error`或`Error Array`。
- `source`: 传给`validate` 方法的源对象。
- `options`: 额外选项。
- `options.messages`: 包含校验 error message 的对象，将与 defaultMessages 进行深度合并。

传给`validate` 或 `asyncValidate`的选项被传递给校验函数，以便于可以在校验函数中引用临时数据（例如 model 引用）。但是有些选项名是保留的; 如果使用`options`对象的这些属性将会导致覆盖。保留的属性是`messages`, `exception` 和 `error`.

```js
import Schema from 'async-validator';
const descriptor = {
  name(rule, value, callback, source, options) {
    const errors = [];
    if (!/^[a-z0-9]+$/.test(value)) {
      errors.push(
        new Error(util.format('%s 必须为小写字母的数字字符', rule.field)),
      );
    }
    return errors;
  },
};
const validator = new Schema(descriptor);
validator.validate({ name: 'Firstname' }, (errors, fields) => {
  if (errors) {
    return handleErrors(errors, fields);
  }
  // 校验通过
});
```

对单个字段的多个校验规则进行测试的情况很常见，此时可以使规则成为一个对象数组，例如:

```js
const descriptor = {
  email: [
    { type: 'string', required: true, pattern: Schema.pattern.email },
    {
      validator(rule, value, callback, source, options) {
        const errors = [];
        // 测试email地址是否已经在数组库中存在
        // 并当已存在时在errors数组中添加一个error
        return errors;
      },
    },
  ],
};
```

#### Type

标志要使用的`validator`的`type`，可识别的`type`值为:

- `string`: 必须为类型 `string`， 这是默认的 type。
- `number`: 必须为类型 `number`。
- `boolean`: 必须为类型 `boolean`。
- `method`: 必须为类型 `function`。
- `regexp`: 必须为 `RegExp`的实例 或者 一个`string`，使用它 new `RegExp`时不能报错。
- `integer`: 必须为类型 `number` 并且是一个整数。
- `float`: 必须为类型 `number` 并且是一个浮点数。
- `array`: 必须是一个 array ，由 `Array.isArray`确定。
- `object`: 必须为类型 `object` 并且 `Array.isArray`返回`false`。
- `enum`: 值必须在 `enum`中存在。
- `date`: 值必须是有效的，由`Date`确定。
- `url`: 必须为类型 `url`。
- `hex`: 必须为类型 `hex`。
- `email`: 必须为类型 `email`。
- `any`: 可以是任意一种类型。

#### Required

`rule`属性`required`指示在校验时该`field`必须在`source`对象上存在

#### Pattern

`rule`属性`pattern`指示在校验时该值必须能通过正则表达式的校验。

#### Range

使用 `min` 和 `max` 属性定义范围。对于`string`和`array`类型，根据`length`属性进行比较，对于`number`类型，数字不能小于 `min`，也不能大于 `max`。

#### Length

若要校验`field`的精确长度，请指定 `len` 属性。对于`string`和`array`类型的比较是在`length`属性上执行的，对于`number`类型，这个属性表示数字的精确匹配，也就是说，它只能严格等于 `len`。

如果 `len` 属性与 `min` 和 `max` 两个 range 属性组合使用，`len` 优先。

#### Enumerable

> 从 3.0.0 版本开始，如果想校验`enum`类型中的值`0`或 `false`，就必须显式地包含它们。

要校验 所有可能值组成的列表 中的值，使用`enum`类型和`enum`属性列出该字段的有效值，例如:

```js
const descriptor = {
  role: { type: 'enum', enum: ['admin', 'user', 'guest'] },
};
```

#### Whitespace

通常将只包含空白的必填字段视为错误。若要为仅由空格组成的字符串添加额外的校验，请向值为 `true` 的规则添加`whitespace`属性。规则必须是`string`类型。

您可能希望对用户输入进行净化，而不是校验`whitespace`，请参阅[transform](#transform)，以了解删除空白的示例。

#### Deep Rules

如果需要校验深层次对象的属性，可以通过将`嵌套规则`分配给`rules`的`fields`属性来校验属于 `object` 或 `array` 类型的校验规则。

```js
const descriptor = {
  address: {
    type: 'object',
    required: true,
    fields: {
      street: { type: 'string', required: true },
      city: { type: 'string', required: true },
      zip: { type: 'string', required: true, len: 8, message: 'invalid zip' },
    },
  },
  name: { type: 'string', required: true },
};
const validator = new Schema(descriptor);
validator.validate({ address: {} }, (errors, fields) => {
  // address.street, address.city, address.zip产生了errors
});
```

请注意，如果没有在父规则上指定`required`属性，那么不在`source`对象上声明该字段是完全有效的，并且深度校验规则也不会执行，因为没有什么需要校验的东西。

深度规则校验为嵌套`rules`创建`schema`，因此还可以指定传递给 `schema.validate()`方法的`options`。

```js
const descriptor = {
  address: {
    type: 'object',
    required: true,
    options: { first: true },
    fields: {
      street: { type: 'string', required: true },
      city: { type: 'string', required: true },
      zip: { type: 'string', required: true, len: 8, message: '无效zip' },
    },
  },
  name: { type: 'string', required: true },
};
const validator = new Schema(descriptor);

validator.validate({ address: {} }).catch(({ errors, fields }) => {
  // 只有street 和 name 产生了 errors
});
```

父规则也会被校验，所以如果你有一组`rules`，比如:

```js
const descriptor = {
  roles: {
    type: 'array',
    required: true,
    len: 3,
    fields: {
      0: { type: 'string', required: true },
      1: { type: 'string', required: true },
      2: { type: 'string', required: true },
    },
  },
};
```

提供`{ roles: ['admin', 'user'] }`这样的`source`对象，将创建两个`error`。一个用于数组长度不匹配，另一个用于缺少索引`2`处所需的数组。

#### defaultField

`defaultField` 属性可以与`array` 或 `object`类型一起使用，以校验内部的所有值。它可能是包含校验规则的 `object` 或 `array`。例如:

```js
const descriptor = {
  urls: {
    type: 'array',
    required: true,
    defaultField: { type: 'url' },
  },
};
```

注意，若将`defaultField` 扩展为`fields`，请参见[deep rules](#deep-rules)。

#### Transform

有时需要校验之前转换值，可能是为了强制转换类型或以某种方式对其进行净化。为此，在校验规则中添加一个`transform`函数。在校验之前对属性进行转换，并重新分配给`source`对象以更改属性的值。

```js
import Schema from 'async-validator';
const descriptor = {
  name: {
    type: 'string',
    required: true,
    pattern: /^[a-z]+$/,
    transform(value) {
      return value.trim();
    },
  },
};
const validator = new Schema(descriptor);
const source = { name: ' user  ' };
validator.validate(source).then(() => assert.equal(source.name, 'user'));
```

如果没有`transform`函数，校验将会失败，原因是`pattern`不匹配，因为输入包含前置和后置空白。但是通过添加`transform`函数，校验成功并且字段值同时被净化。

#### Messages

根据应用的需求，可能需要 `i18n` 支持，或者可能更喜欢个性化的校验`error message`。

最简单的方法是给一个`rule`分配一条`message`:

```js
{ name: { type: 'string', required: true, message: '请填写名称' } }
```

`message`可以是任意类型，比如`jsx`格式：

```js
{ name: { type: 'string', required: true, message: '<b>请填写名称</b>' } }
```

`message`也可以是一个函数，比如`vue-i18n`：

```js
{ name: { type: 'string', required: true, message: () => this.$t( '请填写名称' ) } }
```

对于不同的语言，可能需要相同的`schema`校验规则，在这种情况下，为每种语言复制`schema`规则是无效的。

但是，可以提供你自己的语言版本的`message`，然后把它分配给`schema`:

```js
import Schema from 'async-validator';
const cn = {
  required: '请填写 %s',
};
const descriptor = { name: { type: 'string', required: true } };
const validator = new Schema(descriptor);
// 与defaultMessages深度合并
validator.messages(cn);
...
```

如果要自定义校验函数，最好将`message`字符串分配给`message`对象，然后通过校验函数中的 `options.messages` 属性访问`message`。

#### asyncValidator

可以为指定字段自定义异步校验函数:

```js
const fields = {
  asyncField: {
    asyncValidator(rule, value, callback) {
      ajax({
        url: 'xx',
        value: value,
      }).then(
        function (data) {
          callback();
        },
        function (error) {
          callback(new Error(error));
        },
      );
    },
  },

  promiseField: {
    asyncValidator(rule, value) {
      return ajax({
        url: 'xx',
        value: value,
      });
    },
  },
};
```

#### validator

可以为指定的字段自定义同步校验函数:

```js
const fields = {
  field: {
    validator(rule, value, callback) {
      return value === 'test';
    },
    message: 'Value is not equal to "test".',
  },

  field2: {
    validator(rule, value, callback) {
      return new Error(`${value} is not equal to 'test'.`);
    },
  },

  arrField: {
    validator(rule, value) {
      return [new Error('Message 1'), new Error('Message 2')];
    },
  },
};
```

## 常见问题

### 如何取消 warning

```js
import Schema from 'async-validator';
Schema.warning = function () {};
```

### 如果检查布尔值 `true`

使用 `enum` 类型 并传布尔值 `true` 参数作为选项。

```js
{
  type: 'enum',
  enum: [true],
  message: '',
}
```

## 测试用例

```bash
npm test
```

## 测试覆盖率

```bash
npm run coverage
```

打开 `coverage/ dir`

## 许可证

一切内容皆适用 [MIT](https://en.wikipedia.org/wiki/MIT_License) 许可证。
