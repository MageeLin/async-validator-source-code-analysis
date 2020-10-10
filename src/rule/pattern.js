import * as util from '../util';

/**
 *  校验正则表达式的规则
 *
 *  @param rule 校验的规则
 *  @param value source对象中该字段的值
 *  @param source 要校验的source对象
 *  @param errors 本次校验将要去添加的errors数组
 *  @param options 校验选项
 *  @param options.messages 校验的messages
 */
function pattern(rule, value, source, errors, options) {
  // 当rule中pattern属性存在时
  if (rule.pattern) {
    // 如果pattern是正则表达式的话
    if (rule.pattern instanceof RegExp) {
      // 如果 pattern 是一个 RegExp 实例，则重置'lastIndex'以防它的'global'标志意外地被设置为'true'，
      // 这在校验场景中不是必需的，结果可能会产生误导
      rule.pattern.lastIndex = 0;
      // 如果正则测试不通过
      if (!rule.pattern.test(value)) {
        // options.messages.pattern.mismatch 默认值为 %s value %s does not match pattern %s
        // 三个%s的参数为后三个
        errors.push(
          util.format(
            options.messages.pattern.mismatch,
            rule.fullField,
            value,
            rule.pattern,
          ),
        );
      }
      // 如果pattern是string类型的话
    } else if (typeof rule.pattern === 'string') {
      // 就直接用字符串来生成正则表达式_pattern
      // 其余部分与上面同理
      const _pattern = new RegExp(rule.pattern);
      if (!_pattern.test(value)) {
        errors.push(
          util.format(
            options.messages.pattern.mismatch,
            rule.fullField,
            value,
            rule.pattern,
          ),
        );
      }
    }
  }
}

export default pattern;
