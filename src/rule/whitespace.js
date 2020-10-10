import * as util from '../util';

/**
 *  校验空白字符的规则
 *
 *  @param rule 校验的规则
 *  @param value source对象中该字段的值
 *  @param source 要校验的source对象
 *  @param errors 本次校验将要去添加的errors数组
 *  @param options 校验选项
 *  @param options.messages 校验的messages
 */
function whitespace(rule, value, source, errors, options) {
  // 用正则表达式^\s+$来测试该值为真 或 该值直接为空
  if (/^\s+$/.test(value) || value === '') {
    // options.messages.whitespace 默认为 %s cannot be empty
    // fullField依然是完全的路径
    errors.push(util.format(options.messages.whitespace, rule.fullField));
  }
}

export default whitespace;
