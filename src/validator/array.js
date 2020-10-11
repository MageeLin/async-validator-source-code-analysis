import rules from '../rule/index';
import { isEmptyValue } from '../util';
/**
 *  校验数组
 *
 *  @param rule 校验规则
 *  @param value 该字段在source对象中的值
 *  @param callback 回调函数
 *  @param source 要校验的source对象
 *  @param options 校验选项
 *  @param options.messages 校验message
 */
function array(rule, value, callback, source, options) {
  const errors = [];
  const validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field));
  if (validate) {
    if (isEmptyValue(value, 'array') && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options, 'array');
    // 当值为非空数组时
    if (!isEmptyValue(value, 'array')) {
      // 先校验类型 rule.type
      rules.type(rule, value, source, errors, options);
      // 再校验范围 rule.len max min
      rules.range(rule, value, source, errors, options);
    }
  }
  callback(errors);
}

export default array;
