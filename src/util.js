/* eslint no-console:0 */

const formatRegExp = /%[sdj%]/g;

export let warning = () => {}; // 默认warning不能输出

/* 当在非生产环境或者非node运行时，才输出warning信息 */
if (
  typeof process !== 'undefined' && // Node环境
  process.env &&
  process.env.NODE_ENV !== 'production' && // Node环境不为生产环境
  typeof window !== 'undefined' && // 确保window存在
  typeof document !== 'undefined' // 确保document存在
) {
  // 修改了warning函数
  warning = (type, errors) => {
    // 检查是否能用console
    if (typeof console !== 'undefined' && console.warn) {
      // 检查errors中每一个error是否都是string类型
      if (errors.every((e) => typeof e === 'string')) {
        console.warn(type, errors); // 打印warning
      }
    }
  };
}

/* 转换errors数组的格式，输入errors数组，输出将所有“相同field”的error合并的对象*/
// 输入的格式
// [
//   { "message": "姓名为必填项", "field": "name" },
//   { "message": "年龄超出范围", "field": "information.age" }
// ]
// 返回的格式
// {
//   "name": [{ "message": "姓名为必填项", "field": "name" }],
//   "information.age": [{ "message": "年龄超出范围", "field": "information.age" }]
// }
export function convertFieldsError(errors) {
  if (!errors || !errors.length) return null; // 参数检查，errors应为数组
  const fields = {};
  // 这个迭代是将errors数组的所有“相同field”的error合并
  errors.forEach((error) => {
    const field = error.field; // 拿到每个error的key
    fields[field] = fields[field] || [];
    fields[field].push(error); // 把所有field相同的error一起放到fields[field]这个数组中
  });
  return fields; // 最后返回数组转化后的对象
}

/* 格式化参数，根据第一个参数来决定怎么处理之后的参数 */
export function format(...args) {
  let i = 1;
  const f = args[0];
  const len = args.length;
  // 当第一个参数是function时
  if (typeof f === 'function') {
    return f.apply(null, args.slice(1)); // 把剩余参数给f调用
  }
  // 当第一个参数是string时
  if (typeof f === 'string') {
    // 根据字符串标志来区分处理方式
    let str = String(f).replace(formatRegExp, (x) => {
      if (x === '%%') {
        return '%'; // 如果是%%，就返回%
      }
      if (i >= len) {
        return x;
      }
      switch (x) {
        case '%s':
          return String(args[i++]); // 如果是%s，就返回字符串化的结果
        case '%d':
          return Number(args[i++]); // 如果是%d，就返回数字化的结果
        case '%j':
          try {
            return JSON.stringify(args[i++]); // 如果是%j，就返回JSON
          } catch (_) {
            return '[Circular]';
          }
          break;
        default:
          return x; // 默认原样返回
      }
    });
    return str; // 返回处理后的结果
  }
  return f;
}
/* 是否原始的字符串类型 */
function isNativeStringType(type) {
  // 下面这几种type都算
  return (
    type === 'string' ||
    type === 'url' ||
    type === 'hex' ||
    type === 'email' ||
    type === 'date' ||
    type === 'pattern'
  );
}

/* 根据类型判断是否空值 */
export function isEmptyValue(value, type) {
  // value为undefined或null时肯定是空值
  if (value === undefined || value === null) {
    return true;
  }
  // 数组类型，长度为0，肯定空值
  if (type === 'array' && Array.isArray(value) && !value.length) {
    return true;
  }
  // 原始的字符串类型，空字符串就为空值
  if (isNativeStringType(type) && typeof value === 'string' && !value) {
    return true;
  }
  return false; // 其他情况都认为不空
}

/* 判断是否空对象 */
export function isEmptyObject(obj) {
  return Object.keys(obj).length === 0; // Object.keys等于0就认为空
}

/* 内部方法，异步并行校验 */
// 这里的关键就是asyncParallelArray -> doIt -> cb -> asyncParallelArray，循环调用实现的每一次校验
// arr的格式：[{ rule, value, source, field }]

// func的格式：
// 第一个参数data = { rule, value, source, field }，也就是series中的每一个元素
// 第二个参数 doIt 是 next 函数，doIt 函数用于执行下一个校验器或者最终回调，如下：
// if(options.first) {
//   执行 asyncSerialArray 函数处理参数错误对象数组，将直接调用completeCallback回调，中断后续校验器的执行
// } else {
//   执行 asyncParallelArray 函数将所有校验器的错误对象数组构建成单一数组，供completeCallback回调处理
// }
// (data, doIt) => {
//   const rule = data.rule;
//   let deep =
//     (rule.type === 'object' || rule.type === 'array') &&
//     (typeof rule.fields === 'object' ||
//       typeof rule.defaultField === 'object');
//   deep = deep && (rule.required || (!rule.required && data.value));
//   rule.field = data.field;
//   function addFullfield(key, schema) {}
//   function cb(e = []) {}
//   let res;
//   if (rule.asyncValidator) {} else if (rule.validator) {}
//   if (res && res.then) {}
// },

// callback的格式：
// function next(errors) {
//   callback(errors);
//   return errors.length ? reject(new AsyncValidationError(errors, convertFieldsError(errors))) : resolve();
// };
function asyncParallelArray(arr, func, callback) {
  const results = [];
  let total = 0;
  const arrLength = arr.length;

  // 不断的给结果数组添加error
  function count(errors) {
    results.push.apply(results, errors);
    // errors条数和数组大小一致时结束
    total++;
    if (total === arrLength) {
      callback(results);
    }
  }

  // 给arr中每一条都调用func方法，形成了并行处理
  arr.forEach((a) => {
    func(a, count); // 执行func(element, count)，
  });
}

/* 内部方法，异步有序校验，串行化 */
// 同样，这里的关键也是 asyncSerialArray -> doIt -> asyncSerialArray ，
// 循环调用实现的每一次校验
function asyncSerialArray(arr, func, callback) {
  let index = 0;
  const arrLength = arr.length;

  // 定义一个next内部方法
  function next(errors) {
    // 当errors有内容时
    if (errors && errors.length) {
      callback(errors); // 用callback调用errors
      return;
    }
    // 当errors没有内容时
    const original = index;
    index = index + 1; // 闭包index + 1
    // 当前的index比length小时
    if (original < arrLength) {
      func(arr[original], next); // 执行func(element, next)，形成了递归
    } else {
      callback([]); // 否则调用callback([]);
    }
  }

  // 这里面的几个方法都是用callback来进行的最后返回
  next([]);
}

/* 扁平化对象为数组 */
// 输入格式：
// {
//   "name": [
//     {
//       "rule": {
//         "required": true,
//         "message": "姓名为必填项",
//         "field": "name",
//         "fullField": "name",
//         "type": "string"
//       },
//       "value": "",
//       "source": { "information": { "age": 20 }, "name": "" },
//       "field": "name"
//     }
//   ],
//   "information": [
//     {
//       "rule": {
//         "type": "object",
//         "required": false,
//         "fields": {
//           "age": {
//             "required": true,
//             "type": "number",
//             "max": 10,
//             "min": 1,
//             "message": "年龄超出范围"
//           }
//         },
//         "field": "information",
//         "fullField": "information"
//       },
//       "value": { "age": 20 },
//       "source": { "information": { "age": 20 }, "name": "" },
//       "field": "information"
//     }
//   ]
// }

// 输出格式：
// [
//   {
//     "rule": {
//       "required": true,
//       "message": "姓名为必填项",
//       "field": "name",
//       "fullField": "name",
//       "type": "string"
//     },
//     "value": "",
//     "source": { "information": { "age": 20 }, "name": "" },
//     "field": "name"
//   },
//   {
//     "rule": {
//       "type": "object",
//       "required": false,
//       "fields": {
//         "age": {
//           "required": true,
//           "type": "number",
//           "max": 10,
//           "min": 1,
//           "message": "年龄超出范围"
//         }
//       },
//       "field": "information",
//       "fullField": "information"
//     },
//     "value": { "age": 20 },
//     "source": { "information": { "age": 20 }, "name": "" },
//     "field": "information"
//   }
// ]

function flattenObjArr(objArr) {
  const ret = [];
  Object.keys(objArr).forEach((k) => {
    ret.push.apply(ret, objArr[k]); // 把每一个值push到ret中
  });
  return ret; //返回ret
}

/* 从Error类继承一个异步Error类 */
export class AsyncValidationError extends Error {
  constructor(errors, fields) {
    super('Async Validation Error'); // 将this引进
    this.errors = errors;
    this.fields = fields;
  }
}
// 下面asyncMap方法的objArr的例子
export function asyncMap(objArr, option, func, callback) {
  // 如果option.first选项为真，说明第一个error产生时就要报错
  if (option.first) {
    // pending是一个promise
    const pending = new Promise((resolve, reject) => {
      // 定义一个函数next，这个函数先调用callback，参数是errors
      // 再根据errors的长度决定resolve还是reject
      const next = (errors) => {
        callback(errors);
        return errors.length
          ? // reject的时候，返回一个AsyncValidationError的实例
            // 实例化时第一个参数是errors数组，第二个参数是对象类型的errors
            reject(new AsyncValidationError(errors, convertFieldsError(errors)))
          : resolve();
      };
      // 把对象扁平化为数组flattenArr
      const flattenArr = flattenObjArr(objArr);
      // 串行
      asyncSerialArray(flattenArr, func, next);
    });
    // 捕获error
    pending.catch((e) => e);
    // 返回promise实例
    return pending;
  }

  // 如果option.first选项为假，说明所有的error都产生时才报错
  // 当指定字段的第一个校验规则产生error时调用callback，不再继续处理相同字段的校验规则。
  let firstFields = option.firstFields || [];
  // true意味着所有字段生效。
  if (firstFields === true) {
    firstFields = Object.keys(objArr);
  }
  const objArrKeys = Object.keys(objArr);
  const objArrLength = objArrKeys.length;
  let total = 0;
  const results = [];
  // 这里定义的函数next和上面的类似，只不过多了total的判断
  const pending = new Promise((resolve, reject) => {
    const next = (errors) => {
      results.push.apply(results, errors);
      // 只有全部的校验完才能执行最后的callback和reject
      total++;
      if (total === objArrLength) {
        // 这个callback和reject/resolve是这个库既能回调函数又能promise的核心
        callback(results);
        return results.length
          ? reject(
              new AsyncValidationError(results, convertFieldsError(results)),
            )
          : resolve();
      }
    };
    if (!objArrKeys.length) {
      callback(results);
      resolve();
    }
    // 当firstFields中指定了该key时，说明该字段的第一个校验失败产生时就停止并调用callback
    // 所以是串行的asyncSerialArray
    // 没有指定该key，说明该字段的校验error需要都产生，就并行asyncParallelArray
    objArrKeys.forEach((key) => {
      const arr = objArr[key];
      if (firstFields.indexOf(key) !== -1) {
        asyncSerialArray(arr, func, next);
      } else {
        asyncParallelArray(arr, func, next);
      }
    });
  });
  // 捕获error，添加错误处理
  pending.catch((e) => e);
  // 返回promise实例
  return pending;
}

/* Error的补充，入参为rule，返回map的回调函数  */
export function complementError(rule) {
  // 返回一个函数，这个函数就是map方法的回调函数，参数是每个error
  return (oe) => {
    // 当oe.message属性直接存在时，
    if (oe && oe.message) {
      oe.field = oe.field || rule.fullField; // 用rule.fullField补充field
      return oe;
    }
    // 否则，message为oe()，field为oe.field或rule.fullField补充
    return {
      message: typeof oe === 'function' ? oe() : oe,
      field: oe.field || rule.fullField,
    };
  };
}

/* 深合并 */
export function deepMerge(target, source) {
  // 当新messages存在时
  if (source) {
    // 迭代新messages
    for (const s in source) {
      // 确保s为自身属性key
      if (source.hasOwnProperty(s)) {
        const value = source[s];
        // 当在原messages和新messages中这个键都为object类型时
        if (typeof value === 'object' && typeof target[s] === 'object') {
          // 使用扩展运算符把两个messages合并，新messages优先级高
          target[s] = {
            ...target[s],
            ...value,
          };
        } else {
          // 只要两个messages有一个不是对象，就把新messages的该属性直接赋值给老messages
          target[s] = value;
        }
      }
    }
  }
  return target; // 返回合并后的messages
}
