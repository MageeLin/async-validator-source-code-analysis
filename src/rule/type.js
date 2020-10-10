import * as util from '../util';
import required from './required';

/* eslint max-len:0 */

// 定义几种正则表达式 email、url和hex
const pattern = {
  // http://emailregex.com/
  email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  url: new RegExp(
    '^(?!mailto:)(?:(?:http|https|ftp)://|//)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$',
    'i',
  ),
  hex: /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i,
};

// 定义一些类型检测工具函数
const types = {
  // 整数
  integer(value) {
    return types.number(value) && parseInt(value, 10) === value;
  },
  // 浮点数
  float(value) {
    return types.number(value) && !types.integer(value);
  },
  // 数组
  array(value) {
    return Array.isArray(value);
  },
  // 正则表达式
  regexp(value) {
    if (value instanceof RegExp) {
      return true;
    }
    try {
      return !!new RegExp(value);
    } catch (e) {
      return false;
    }
  },
  // 时间
  date(value) {
    return (
      typeof value.getTime === 'function' &&
      typeof value.getMonth === 'function' &&
      typeof value.getYear === 'function' &&
      !isNaN(value.getTime())
    );
  },
  // 数字
  number(value) {
    if (isNaN(value)) {
      return false;
    }
    return typeof value === 'number';
  },
  // 对象，并且不能是数组
  object(value) {
    return typeof value === 'object' && !types.array(value);
  },
  // 方法
  method(value) {
    return typeof value === 'function';
  },
  // email
  email(value) {
    return (
      typeof value === 'string' &&
      !!value.match(pattern.email) &&
      value.length < 255
    );
  },
  // url
  url(value) {
    return typeof value === 'string' && !!value.match(pattern.url);
  },
  // 十六进制
  hex(value) {
    return typeof value === 'string' && !!value.match(pattern.hex);
  },
};

/**
 * 校验值类型的规则
 *
 *  @param rule 校验的规则
 *  @param value source对象中该字段的值
 *  @param source 要校验的source对象
 *  @param errors 本次校验将要去添加的errors数组
 *  @param options 校验选项
 *  @param options.messages 校验的messages
 */
function type(rule, value, source, errors, options) {
  // 当rule中required属性为真并且value存在时
  if (rule.required && value === undefined) {
    // 先调用required来验证对于要求的类型是否不为空值
    required(rule, value, source, errors, options);
    return;
  }
  const custom = [
    'integer',
    'float',
    'array',
    'regexp',
    'object',
    'method',
    'email',
    'number',
    'date',
    'url',
    'hex',
  ];
  const ruleType = rule.type;
  // 如果custom数组中存在rule.type这种类型
  if (custom.indexOf(ruleType) > -1) {
    // 调用对应的类型检查工具函数
    if (!types[ruleType](value)) {
      // 检查失败的话就添加新的error
      errors.push(
        // options.messages.types[ruleType]的默认值有很多种，比如%s is not an %s
        util.format(
          options.messages.types[ruleType],
          rule.fullField,
          rule.type,
        ),
      );
    }
  // 如果custom数组中不存在rule.type这种类型，就进行直接的原生类型检查 ？？存疑？？
  } else if (ruleType && typeof value !== rule.type) {
    errors.push(
      util.format(options.messages.types[ruleType], rule.fullField, rule.type),
    );
  }
}

export default type;
