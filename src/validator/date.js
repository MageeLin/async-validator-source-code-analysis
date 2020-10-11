import rules from '../rule/index.js';
import { isEmptyValue } from '../util';

/**
 * 校验时间
 *
 *  @param rule 校验规则
 *  @param value 该字段在source对象中的值
 *  @param callback 回调函数
 *  @param source 要校验的source对象
 *  @param options 校验选项
 *  @param options.messages 校验message
 */
function date(rule, value, callback, source, options) {
  // console.log('integer rule called %j', rule);
  const errors = [];
  const validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field));
  // console.log('validate on %s value', value);
  if (validate) {
    if (isEmptyValue(value, 'date') && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    // 当是非空 时间值时
    if (!isEmptyValue(value, 'date')) {
      let dateObject;

      // 不管是时间字符串还是时间实例，都格式化成Date的实例
      if (value instanceof Date) {
        dateObject = value;
      } else {
        dateObject = new Date(value);
      }

      rules.type(rule, dateObject, source, errors, options);
      if (dateObject) {
        // 校验时间戳是否在范围内 rule.len max min
        rules.range(rule, dateObject.getTime(), source, errors, options);
      }
    }
  }
  callback(errors);
}

export default date;
