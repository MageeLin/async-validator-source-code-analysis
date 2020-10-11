import rules from '../rule/index.js';

/**
 * 校验必需字段
 *
 *  @param rule 校验规则
 *  @param value 该字段在source对象中的值
 *  @param callback 回调函数
 *  @param source 要校验的source对象
 *  @param options 校验选项
 *  @param options.messages 校验message
 */
function required(rule, value, callback, source, options) {
  // 初始化errors数组
  const errors = [];
  // 如果是数组，type就给‘array’，不是数组就typeof来求
  // typeof的结果：undefined object boolean number bigint string symbol function
  const type = Array.isArray(value) ? 'array' : typeof value;
  // 这里去调用rules.required来给errors数组添加error
  rules.required(rule, value, source, errors, options, type);
  // 用回调函数来处理errors数组
  callback(errors);
}

export default required;
