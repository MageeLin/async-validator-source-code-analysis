import rules from '../rule/index.js';
import { isEmptyValue } from '../util';

/**
 *  执行字符串类型校验
 *
 *  @param rule 校验规则
 *  @param value 该字段在source对象中的值
 *  @param callback 回调函数
 *  @param source 要校验的source对象
 *  @param options 校验选项
 *  @param options.messages 校验message
 */
function string(rule, value, callback, source, options) {
  const errors = [];
  const validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field));
  if (validate) {
    if (isEmptyValue(value, 'string') && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options, 'string');
    if (!isEmptyValue(value, 'string')) {
      // 先校验类型规则 rule.type
      rules.type(rule, value, source, errors, options);
      // 再校验范围规则 rule.len max min
      rules.range(rule, value, source, errors, options);
      // 再校验模式规则 rule.pattern
      rules.pattern(rule, value, source, errors, options);
      if (rule.whitespace === true) {
        // 当rule.whitespace为true时，还要校验whitespace规则
        rules.whitespace(rule, value, source, errors, options);
      }
    }
  }
  callback(errors);
}

export default string;
