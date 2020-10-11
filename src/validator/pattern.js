import rules from '../rule/index.js';
import { isEmptyValue } from '../util';

/**
 *  校验正则表达式
 *
 * 
 * 当rule中只包含pattern而不规定type为string时，执行这个校验
 *
 *  @param rule 校验规则
 *  @param value 该字段在source对象中的值
 *  @param callback 回调函数
 *  @param source 要校验的source对象
 *  @param options 校验选项
 *  @param options.messages 校验message
 */
function pattern(rule, value, callback, source, options) {
  const errors = [];
  const validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field));
  if (validate) {
    if (isEmptyValue(value, 'string') && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (!isEmptyValue(value, 'string')) {
      // 校验正则表达式规则
      rules.pattern(rule, value, source, errors, options);
    }
  }
  callback(errors);
}

export default pattern;
