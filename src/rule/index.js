import required from './required';
import whitespace from './whitespace';
import type from './type';
import range from './range';
import enumRule from './enum';
import pattern from './pattern';

/**
 * 统一的出口管理，这些方法的主要作用就是给errors数组添加对应的error
 *
 *  @param rule 校验的规则
 *  @param value source对象中该字段的值
 *  @param source 要校验的source对象
 *  @param errors 本次校验将要去添加的errors数组
 *  @param options 校验选项
 *  @param options.messages 校验的messages
 */
export default {
  required,
  whitespace,
  type,
  range,
  enum: enumRule,
  pattern,
};
