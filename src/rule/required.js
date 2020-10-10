// 导入util
import * as util from '../util';

/**
 * 校验必填字段的规则
 *
 *  @param rule 校验的规则
 *  @param value source对象中该字段的值
 *  @param source 要校验的source对象
 *  @param errors 本次校验将要去添加的errors数组
 *  @param options 校验选项
 *  @param options.messages 校验的messages
 */
function required(rule, value, source, errors, options, type) {
  // rule的required字段为true 且
  // （source对象中没有这个字段 或 根据类型判断这个字段为空值）
  if (
    rule.required &&
    (!source.hasOwnProperty(rule.field) ||
      util.isEmptyValue(value, type || rule.type))
  ) {
    // 下面是一个options的例子
    // {
    //   firstFields: true
    //   messages: {
    //     array: {len: "%s must be exactly %s in length", min: "%s cannot be less than %s in length", max: "%s cannot be greater than %s in length", range: "%s must be between %s and %s in length"}
    //     clone: ƒ clone()
    //     date: {format: "%s date %s is invalid for format %s", parse: "%s date could not be parsed, %s is invalid ", invalid: "%s date %s is invalid"}
    //     default: "Validation error on field %s"
    //     enum: "%s must be one of %s"
    //     number: {len: "%s must equal %s", min: "%s cannot be less than %s", max: "%s cannot be greater than %s", range: "%s must be between %s and %s"}
    //     pattern: {mismatch: "%s value %s does not match pattern %s"}
    //     required: "%s is required"
    //     string: {len: "%s must be exactly %s characters", min: "%s must be at least %s characters", max: "%s cannot be longer than %s characters", range: "%s must be between %s and %s characters"}
    //     types: {string: "%s is not a %s", method: "%s is not a %s (function)", array: "%s is not an %s", object: "%s is not an %s", number: "%s is not a %s", …}
    //     whitespace: "%s cannot be empty"
    //   }
    // }

    // 下面是一个rule的例子
    // {
    //   field: "b",
    //   fullField: "a.b",
    //   message: "b为必填项",
    //   required: true,
    //   type: "string",
    //   validator: ƒ string(rule, value, callback, source, options)
    // }


    // 此时就在errors数组中添加一个格式化后的error
    // options.messages.required，默认的是 %s is required
    // rule.fullField是完全的字段路径，比如 a.b，
    // 此时经过format格式化后就变成 a.b is required
    errors.push(util.format(options.messages.required, rule.fullField));
  }
}

export default required;
