import string from './string';
import method from './method';
import number from './number';
import boolean from './boolean';
import regexp from './regexp';
import integer from './integer';
import float from './float';
import array from './array';
import object from './object';
import enumValidator from './enum';
import pattern from './pattern';
import date from './date';
import required from './required';
import type from './type';
import any from './any';


// /**
//  *  校验方法的统一入口管理
//  *
//  *  @param rule 校验规则
//  *  @param value 该字段在source对象中的值
//  *  @param callback 回调函数
//  *  @param source 要校验的source对象
//  *  @param options 校验选项
//  *  @param options.messages 校验message
//  */
// function foo(rule, value, callback, source, options) { // foo是各种各样不同类型
//   const errors = []; // 初始化errors数组
//   // 判断是否需要校验
//   // 这里分了两种情况
//   // 第一种是该字段是必需的
//   // 第二种是该字段不必需，但是source对象中该字段有值，也就是该字段被填写了。
//   const validate =
//     rule.required || (!rule.required && source.hasOwnProperty(rule.field));
//   if (validate) { // 如果需要校验时
//     // 下面的if是对第二种情况又细分
//     // 如果对该类型不必需验证且该字段有值，但是值为空值，就需要单独拎出来
//     if (isEmptyValue(value, 'foo') && !rule.required) {
//       return callback(); // 就直接callback一个undefined
//     }
//     // 下面就是普通情况的处理了
//     rules.required(rule, value, source, errors, options); // 正式校验之前先把字段必需的required规则校验
//     if (value !== undefined) { // 当值不为undefined时，再进行对应的各种不同类型的规则校验
//       rules.foo(rule, value, source, errors, options);
//     }
//   }
//   // 最后用回调函数调用errors，这也是validator目录下文件的最终目的
//   callback(errors);
// }

export default {
  string,
  method,
  number,
  boolean,
  regexp,
  integer,
  float,
  array,
  object,
  enum: enumValidator,
  pattern,
  date,
  url: type, // 可以发现url hex 和 email三种类型都交给typeValidator来处理了
  hex: type,
  email: type,
  required,
  any,
};
