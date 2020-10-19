import {
  format,
  complementError,
  asyncMap,
  warning,
  deepMerge,
  convertFieldsError,
} from './util';
import validators from './validator/index';
import { messages as defaultMessages, newMessages } from './messages';

/**
 *  封装校验的schema
 *
 *  @param descriptor 一个对此schema声明了校验规则的对象
 */
// Schema构造函数
function Schema(descriptor) {
  // 实例的属性rules默认为空
  this.rules = null;
  // 实例的私有属性_messages默认为messages.js文件里的内容
  this._messages = defaultMessages;
  // 正式开始构建实例！
  this.define(descriptor);
}

// Schema的原型方法
Schema.prototype = {
  messages(messages) {
    // 如果新的messages参数存在
    if (messages) {
      // 将 默认messages 和 参数 合并
      this._messages = deepMerge(newMessages(), messages);
    }
    // 最后把合并后的messages返回
    return this._messages;
  },
  define(rules) {
    // 如果 参数 不存在，就抛出错误
    if (!rules) {
      throw new Error('Cannot configure a schema with no rules');
    }
    // 参数必须是个非数组对象
    if (typeof rules !== 'object' || Array.isArray(rules)) {
      throw new Error('Rules must be an object');
    }
    // 初始化
    this.rules = {};
    let z;
    let item;
    // 迭代
    for (z in rules) {
      // 必须是自身属性
      if (rules.hasOwnProperty(z)) {
        item = rules[z];
        // 逐个把rule的属性复制到this.rules中，而且都封装成数组格式
        this.rules[z] = Array.isArray(item) ? item : [item];
      }
    }
  },
  // 最重要的方法，实例上的校验方法
  // - `source_`: 需要校验的对象（必选）。
  // - `o`: 描述校验的处理选项的对象（可选）。
  // - `oc`: 当校验完成时调用的回调函数（必选）。
  validate(source_, o = {}, oc = () => {}) {
    let source = source_;
    let options = o;
    let callback = oc;
    // 参数变换，因为options是可选的，所以第二个参数为函数时
    // 说明第二个参数是callback，options自然就是空对象
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    // 排除错误情况，实例上的rules是错误的
    if (!this.rules || Object.keys(this.rules).length === 0) {
      if (callback) {
        // 此时callback(undefined)
        callback();
      }
      // 最后返回一个resolved的promise
      return Promise.resolve();
    }

    // 内部定义了个complete 函数，目的是如何callback最后生成的 errors 和 fields
    // 入参results = [{ message, field }]
    // 返回的结果是errors = [{ field, message }]和参数fields = { fullFieldName: [{field, message}] }
    // 然后把 errors 和 fields 传给 callback 调用
    function complete(results) {
      // 初始化
      let i;
      let errors = [];
      let fields = {};

      // 内部的内部定义了一个add函数
      function add(e) {
        // 给闭包中的errors添加新的error
        if (Array.isArray(e)) {
          errors = errors.concat(...e);
        } else {
          errors.push(e);
        }
      }

      // 迭代参数results，把results中的每个error加到errors数组中
      for (i = 0; i < results.length; i++) {
        add(results[i]);
      }
      // 最后的结果里，如果什么error都没有，就返回null
      if (!errors.length) {
        errors = null;
        fields = null;
      } else {
        // 要不然就把数组形式的errors转换格式
        // 把errors中相同field的error合并，转化为对象的形式
        fields = convertFieldsError(errors);
      }
      // 最后callback调用数组形式和对象形式的errors
      callback(errors, fields);
    }

    // 如果options中给了messages属性
    // 就需要合并messages
    if (options.messages) {
      // 调用实例上的messages方法创建一个message
      // 其实就是默认的message
      let messages = this.messages();
      if (messages === defaultMessages) {
        messages = newMessages();
      }
      // 将options的messages与默认的messages合并后赋值给options.messages
      deepMerge(messages, options.messages);
      options.messages = messages;
    } else {
      // options没有messages属性就给个默认值
      options.messages = this.messages();
    }
    // 校验规则转换。将参数 rules 复合为 series 对象
    // series = { key: [{ rule, value, source, field }] }
    let arr;
    let value;
    const series = {};
    // keys是rules的所有键
    // 要注意此处的rules其实是单层的rule，所以每一个深度都要执行一次
    const keys = options.keys || Object.keys(this.rules);
    keys.forEach((z) => {
      // arr是rule[z]的，是一个数组
      // 存放的是该字段对应的所有rule
      arr = this.rules[z];
      // value是source[z]，是一个值或者对象
      value = source[z];
      // 迭代z这个字段的所有rule
      arr.forEach((r) => {
        let rule = r;
        // 当有transform属性而且是个函数时，要提前把值转换
        if (typeof rule.transform === 'function') {
          // 浅拷贝下，打破引用
          if (source === source_) {
            source = { ...source };
          }
          // 转换value
          value = source[z] = rule.transform(value);
        }
        // 当rule本身就是个function时，赋值给validator统一处理
        if (typeof rule === 'function') {
          rule = {
            validator: rule,
          };
        // 不是function时，浅拷贝打破引用
        } else {
          rule = { ...rule };
        }
        // 规范validator属性，统一处理方式
        rule.validator = this.getValidationMethod(rule);
        // 给rule加上field、fullField和type
        rule.field = z;
        rule.fullField = rule.fullField || z;
        rule.type = this.getType(rule);
        // 异常处理
        if (!rule.validator) {
          return;
        }
        // 最后生成了完整了series = { key: [{ rule, value, source, field }] }
        series[z] = series[z] || [];
        series[z].push({
          rule,
          value,
          source,
          field: z,
        });
      });
    });
    
    const errorFields = {};
    // 到了这一步就是返回util.asyncMap的结果
    // 四个参数：
    // series = { key: [{ rule, value, source, field }] }
    // options = rule.option
    // singleValidator 用于接收单个校验器，并操控下一个校验器的执行
    // completeCallback 最终回调函数，用于执行内部回调complete函数
    return asyncMap(
      series,
      options,
      // 下面这个就是func函数，不管是并行还是串行，都要用这个func来校验和添加error
      // 第一个参数data = { rule, value, source, field }，也就是series中的每一个元素
      // 第二个参数 doIt 是 next 函数，doIt 函数用于执行下一个校验器或者最终回调，如下：
      // if(options.first) {
      //   执行 asyncSerialArray 函数处理参数错误对象数组，将直接调用completeCallback回调，中断后续校验器的执行
      // } else {
      //   执行 asyncParallelArray 函数将所有校验器的错误对象数组构建成单一数组，供completeCallback回调处理
      // }
      (data, doIt) => {
        const rule = data.rule;
        // 通过rule.type、rule.fields、rule.defaultField判断是否深度校验。若是，内部变量deep置为真。
        let deep =
          (rule.type === 'object' || rule.type === 'array') &&
          (typeof rule.fields === 'object' ||
            typeof rule.defaultField === 'object');
        deep = deep && (rule.required || (!rule.required && data.value));
        rule.field = data.field;

        // 定义addFullfield函数，用于获取深度校验时嵌套对象属性的fullField。
        function addFullfield(key, schema) {
          return {
            ...schema,
            fullField: `${rule.fullField}.${key}`,
          };
        }

        // 定义单次校验后执行的回调函数cb。cb的实现机制中，
        // 包含将错误对象加工为[{ field, message }]数据格式；
        function cb(e = []) {
          // 确保封装成数组
          let errors = e;
          if (!Array.isArray(errors)) {
            errors = [errors];
          }
          // 如果没有取消内部警告，并且errors数组长度不为0，就弹出警告
          if (!options.suppressWarning && errors.length) {
            Schema.warning('async-validator:', errors);
          }
          // 如果errors数组长度不为0，并且有message，就替换成message
          if (errors.length && rule.message) {
            // 这个写法是保证数组格式
            errors = [].concat(rule.message);
          }

          // 比如，errors本来是 ["姓名为必填项"]
          errors = errors.map(complementError(rule));
          // 补充完是[{message: "姓名为必填项", field: "name"}]

          // 当options设置了first属性后，并且有error时，就该doIt返回了
          if (options.first && errors.length) {
            errorFields[rule.field] = 1;
            return doIt(errors);
          }
          // 当rule深度只有一层，也该直接doIt返回
          if (!deep) {
            doIt(errors);
          } else {
            // 如果rule是required的，但是在rule级别上目标对象不存在，那么就不继续向下
            if (rule.required && !data.value) {
              // rule的message存在就完善下
              if (rule.message) {
                errors = [].concat(rule.message).map(complementError(rule));
              // 未公开的属性？自己决定怎么处理errors
              } else if (options.error) {
                errors = [
                  options.error(
                    rule,
                    format(options.messages.required, rule.field),
                  ),
                ];
              }
              // 相当于是在deep没有到头却遇到了该停的地方，也该直接doIt返回
              return doIt(errors);
            }

            // 新建一个fieldsSchema对象
            let fieldsSchema = {};
            if (rule.defaultField) {
              for (const k in data.value) {
                if (data.value.hasOwnProperty(k)) {
                  fieldsSchema[k] = rule.defaultField;
                }
              }
            }
            // 合并
            fieldsSchema = {
              ...fieldsSchema,
              ...data.rule.fields,
            };
            // 合并完之后格式如下：
            // { name: rule{} }

            // 数组化并添加fullField
            for (const f in fieldsSchema) {
              if (fieldsSchema.hasOwnProperty(f)) {
                const fieldSchema = Array.isArray(fieldsSchema[f])
                  ? fieldsSchema[f]
                  : [fieldsSchema[f]];
                fieldsSchema[f] = fieldSchema.map(addFullfield.bind(null, f));
              }
            }
            // 完成之后格式如下
            // [ rule{} ]
            

            // 在这里又new了一个新的Schema对象，用于验证更深一级的value
            const schema = new Schema(fieldsSchema);
            schema.messages(options.messages);
            // 如果自身的rule有option，就给它配上上一层的options
            if (data.rule.options) {
              data.rule.options.messages = options.messages;
              data.rule.options.error = options.error;
            }
            // 子Schema对象依然要去执行实例的validate方法，类似递归
            schema.validate(
              data.value,
              data.rule.options || options,
              (errs) => {
                const finalErrors = [];
                if (errors && errors.length) {
                  finalErrors.push(...errors);
                }
                if (errs && errs.length) {
                  finalErrors.push(...errs);
                }
                // 把子规则的验证结果也要返回
                doIt(finalErrors.length ? finalErrors : null);
              },
            );
          }
        }

        let res;
        // 如果指定了asyncValidator属性，就优先调用async，否则就去执行validator
        if (rule.asyncValidator) {
          res = rule.asyncValidator(rule, data.value, cb, data.source, options);
        } else if (rule.validator) {
          res = rule.validator(rule, data.value, cb, data.source, options);
          // 
          if (res === true) {
            cb();
          } else if (res === false) {
            cb(rule.message || `${rule.field} fails`);
          } else if (res instanceof Array) {
            cb(res);
          } else if (res instanceof Error) {
            cb(res.message);
          }
        }
        // 若返回Promise实例，cb将在该Promise实例的then方法中执行。
        if (res && res.then) {
          // 利用这个promise的then结构实现了异步的校验
          res.then(
            () => cb(),
            (e) => cb(e),
          );
        }
      },
      // 这里是如何callback errors
      (results) => {
        complete(results);
      },
    );
  },
  // 规范rule的中的type然后返回，避免有的rule不写type属性
  getType(rule) {
    // 如果rule没有设置type，但是pattern属性是个正则表达式实例
    if (rule.type === undefined && rule.pattern instanceof RegExp) {
      // 就把type设成pattern
      rule.type = 'pattern';
    }
    // 如果rule的validator属性不是个function，且rule设置了未知的type
    if (
      typeof rule.validator !== 'function' &&
      rule.type &&
      !validators.hasOwnProperty(rule.type)
    ) {
      // 就抛出错误“未知的rule类型”
      throw new Error(format('Unknown rule type %s', rule.type));
    }
    // 规范了以后，返回type，没有就默认string
    return rule.type || 'string';
  },
  // 获取校验方法
  getValidationMethod(rule) {
    // 如果rule有validator属性，直接使用validator
    if (typeof rule.validator === 'function') {
      return rule.validator;
    }
    // 拿到rule所有的key
    const keys = Object.keys(rule);
    const messageIndex = keys.indexOf('message');
    // 由于message是默认就有的rule属性，所以计算length不能带它
    if (messageIndex !== -1) {
      keys.splice(messageIndex, 1);
    }
    // 当keys长度为一而且是required时
    if (keys.length === 1 && keys[0] === 'required') {
      // 校验方法就是required校验器
      return validators.required;
    }
    // 普通情况就根据rule来返回校验器，validators查不到时就返回false
    return validators[this.getType(rule)] || false;
  },
};

// Schema的静态属性，存储了从validator目录中引进来的众多类型的校验器
Schema.validators = validators;

// Schema的静态方法，添加一个新类型的校验器
Schema.register = function register(type, validator) {
  // 校验器必需是个函数，不是就报错
  if (typeof validator !== 'function') {
    throw new Error(
      'Cannot register a validator by type, validator is not a function',
    );
  }
  validators[type] = validator;
};

// Schema的静态方法，在开发环境中可以console.warn
Schema.warning = warning;

// Schema的静态属性，存储了各种类型的默认message
Schema.messages = defaultMessages;

export default Schema;
