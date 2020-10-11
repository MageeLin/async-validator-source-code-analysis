import rules from '../rule/index.js';
import { isEmptyValue } from '../util';

/**
 *  校验任意类型
 *
 *  @param rule 校验规则
 *  @param value 该字段在source对象中的值
 *  @param callback 回调函数
 *  @param source 要校验的source对象
 *  @param options 校验选项
 *  @param options.messages 校验message
 */
function any(rule, value, callback, source, options) {
  const errors = [];
  const validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field));
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    // 任意类型，所以只用校验该值存在即可
    rules.required(rule, value, source, errors, options);
  }
  callback(errors);
}

export default any;
