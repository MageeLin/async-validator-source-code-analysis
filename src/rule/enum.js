import * as util from '../util';

const ENUM = 'enum';

/**
 *  校验值是否存在在枚举值列表中的规则
 *
 *  @param rule 校验的规则
 *  @param value source对象中该字段的值
 *  @param source 要校验的source对象
 *  @param errors 本次校验将要去添加的errors数组
 *  @param options 校验选项
 *  @param options.messages 校验的messages
 */
function enumerable(rule, value, source, errors, options) {
  // 先检查rule中的enum属性是否为一个数组，不是的话就改为空数组
  rule[ENUM] = Array.isArray(rule[ENUM]) ? rule[ENUM] : [];
  // 在数组中搜索value
  if (rule[ENUM].indexOf(value) === -1) {
    // 搜不到value时就给errors数组添加一个error
    errors.push(
      // options.messages[ENUM]的默认值是%s must be one of %s
      // 后两个参数就是两个%s占位所代表的参数
      util.format(
        options.messages[ENUM],
        rule.fullField,
        rule[ENUM].join(', '),
      ),
    );
  }
}

export default enumerable;
