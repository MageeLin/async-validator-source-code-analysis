import * as util from '../util';

/**
 *  校验是否满足最大最小值合理区间的的规则
 *
 *  @param rule 校验的规则
 *  @param value source对象中该字段的值
 *  @param source 要校验的source对象
 *  @param errors 本次校验将要去添加的errors数组
 *  @param options 校验选项
 *  @param options.messages 校验的messages
 */
function range(rule, value, source, errors, options) {
  // rule中的len、min、max是否存在并且是数字类型
  const len = typeof rule.len === 'number';
  const min = typeof rule.min === 'number';
  const max = typeof rule.max === 'number';
  // 正则匹配码点范围从U+010000一直到U+10FFFF的文字（补充平面Supplementary Plane）
  const spRegexp = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
  let val = value;
  let key = null;
  // value是否是number类型 string类型或者数组类型
  const num = typeof value === 'number';
  const str = typeof value === 'string';
  const arr = Array.isArray(value);
  // 把类型名赋给key变量
  if (num) {
    key = 'number';
  } else if (str) {
    key = 'string';
  } else if (arr) {
    key = 'array';
  }
  // 如果值不是支持范围校验的类型
  // 那么校验规则应该type属性来测试特定的类型
  if (!key) {
    // 不是这三种类型，就直接返回false
    return false;
  }
  // 如果是value是数组类型，val设为数组长度
  if (arr) {
    val = value.length;
  }
  // 如果value是string类型，val设为字符串长度
  if (str) {
    // 处理码点大于U+010000的文字length属性不准确的bug，如"𠮷𠮷𠮷".lenght !== 3
    val = value.replace(spRegexp, '_').length;
  }
  // 到这一步时，如果是数字类型，自然val就是那个数字


  // 如果规则中len属性存在，就优先len属性来匹配
  if (len) {
    if (val !== rule.len) {
      // 参照min的分析
      errors.push(
        util.format(options.messages[key].len, rule.fullField, rule.len),
      );
    }
    // 不存在len属性时的比较都是开区间
    // 只有min属性存在，就看看是否满足大于min的条件
  } else if (min && !max && val < rule.min) {
    // 不满足时，给errors数组添加一个error
    errors.push(
      // 对于三种类型不同的情况，options.messages[key].min给出的默认值不一致
      // options.messages['array'].min是"%s cannot be less than %s in length"
      // options.messages['number'].min是"%s cannot be less than %s"
      // options.messages['string'].min是"%s must be at least %s characters"

      // 第二个参数还是完全路径的name，比如a.b

      // 第三个参数是min值，比如10

      // 这样format格式化后返回的结果就是“a.b cannot be less than 10”
      util.format(options.messages[key].min, rule.fullField, rule.min),
    );
    // 只有max属性存在，就看看是否满足小于max的条件
  } else if (max && !min && val > rule.max) {
    // 参照min的分析
    errors.push(
      util.format(options.messages[key].max, rule.fullField, rule.max),
    );
    // min和max属性都存在，就看看是否满足大于min且小于max的条件
  } else if (min && max && (val < rule.min || val > rule.max)) {
    // 参照min的分析
    errors.push(
      util.format(
        options.messages[key].range,
        rule.fullField,
        rule.min,
        rule.max,
      ),
    );
  }
}

export default range;
