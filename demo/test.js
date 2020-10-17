function asyncParallelArray(arr, func, callback) {
  arr.forEach(function (a) {
    func(a, callback);
  });
}

function asyncMap(objArr, option, func, callback) {
  var results = [errors];
  var pending = new Promise(function (resolve, reject) {
    var next = function next(errors) {
      callback(results);
      reject(new AsyncValidationError(results, convertFieldsError(results)));
    };
    asyncParallelArray(arr, func, next);
  });
  pending['catch'](function (e) {
    return e;
  });
  return pending;
}

Schema.prototype = {
  validate: function validate(source, options, callback) {
    function complete(results) {
      callback(errors, fields);
    }

    var series = {};

    var errorFields = {};

    return asyncMap(
      series,
      options,
      function (data, doIt) {
        function cb(e) {
          var errors = e;
          doIt();
          fieldsSchema = _extends(_extends({}, fieldsSchema), data.rule.fields);

          var schema = new Schema(fieldsSchema);
          schema.messages(options.messages);
          // 利用validate递归的doIt
          schema.validate(data.value, data.rule.options || options, function (
            errs,
          ) {
            var finalErrors = [];
            doIt(finalErrors.length ? finalErrors : null);
          });
        }

        var res;

        if (rule.asyncValidator) {
          res = rule.asyncValidator(rule, data.value, cb, data.source, options);
        } else if (rule.validator) {
          res = rule.validator(rule, data.value, cb, data.source, options);
        }
        cb(res);
      },
      function (results) {
        complete(results);
      },
    );
  },
};

// 分割

function asyncMap(objArr, option, func, callback) {
  var results = [errors];
  var pending = new Promise(function (resolve, reject) {
    var next = function next(errors) {
      callback(results);
      reject(new AsyncValidationError(results, convertFieldsError(results)));
    };
    arr.forEach(function (a) {
      func(a, next);
    });
  });
  pending['catch'](function (e) {
    return e;
  });
  return pending;
}

Schema.prototype = {
  validate: function validate(source, options, callback) {
    function complete(results) {
      callback(errors, fields);
    }

    var series = {};

    var errorFields = {};

    return asyncMap(
      series,
      options,
      function (data, doIt) {
        function cb(e) {
          var errors = e;
          doIt();
          fieldsSchema = _extends(_extends({}, fieldsSchema), data.rule.fields);

          var schema = new Schema(fieldsSchema);
          schema.messages(options.messages);
          // 利用validate递归的doIt
          schema.validate(data.value, data.rule.options || options, function (
            errs,
          ) {
            var finalErrors = [];
            doIt(finalErrors.length ? finalErrors : null);
          });
        }

        var res;

        if (rule.asyncValidator) {
          res = rule.asyncValidator(rule, data.value, cb, data.source, options);
        } else if (rule.validator) {
          res = rule.validator(rule, data.value, cb, data.source, options);
        }
        cb(res);
      },
      function (results) {
        complete(results);
      },
    );
  },
};

// 分割
Schema.prototype = {
  validate: function validate(source, options, callback) {
    function complete(results) {
      callback(errors, fields);
    }

    var series = {};

    var errorFields = {};

    return (function asyncMap(series, options) {
      var results = [errors];
      var pending = new Promise(function (resolve, reject) {
        var next = function next(errors) {
          complete(results);
          reject(
            new AsyncValidationError(results, convertFieldsError(results)),
          );
        };
        arr.forEach(function (a) {
          function cb(e) {
            var errors = e;
            next();
            fieldsSchema = _extends(_extends({}, fieldsSchema), a.rule.fields);

            var schema = new Schema(fieldsSchema);
            schema.messages(options.messages);
            // 利用validate递归的doIt
            schema.validate(a.value, a.rule.options || options, function (
              errs,
            ) {
              var finalErrors = [];
              next(finalErrors.length ? finalErrors : null);
            });
          }

          var res;

          if (rule.asyncValidator) {
            res = rule.asyncValidator(
              rule,
              data.value,
              cb,
              data.source,
              options,
            );
          } else if (rule.validator) {
            res = rule.validator(rule, data.value, cb, data.source, options);
          }
          cb(res);
        });
      });
      pending['catch'](function (e) {
        return e;
      });
      return pending;
    })(series, options);
  },
};

// 分割

Schema.prototype = {
  validate: function validate(source, options, callback) {
    function complete(results) {
      callback(errors, fields);
    }

    var series = {};

    var errorFields = {};

    var results = [errors];
    var pending = new Promise(function (resolve, reject) {
      var next = function next(errors) {
        complete(results);
        reject(new AsyncValidationError(results, convertFieldsError(results)));
      };
      arr.forEach(function (a) {
        function cb(e) {
          var errors = e;
          next();
          fieldsSchema = _extends(_extends({}, fieldsSchema), a.rule.fields);

          var schema = new Schema(fieldsSchema);
          schema.messages(options.messages);
          // 利用validate递归的doIt
          schema.validate(a.value, a.rule.options || options, function (errs) {
            var finalErrors = [];
            next(finalErrors.length ? finalErrors : null);
          });
        }

        var res;

        if (rule.asyncValidator) {
          res = rule.asyncValidator(rule, data.value, cb, data.source, options);
        } else if (rule.validator) {
          res = rule.validator(rule, data.value, cb, data.source, options);
        }
        cb(res);
      });
    });
    pending['catch'](function (e) {
      return e;
    });
    return pending;
  },
};

// 分割

Schema.prototype = {
  validate: function validate(source, options, callback) {
    var series = {};

    var errorFields = {};

    var results = [errors];
    var pending = new Promise(function (resolve, reject) {
      total = 0;
      arr.forEach(function (a) {
        var res;
        if (rule.asyncValidator) {
          res = rule.asyncValidator(rule, a.value, cb, a.source, options);
        } else if (rule.validator) {
          res = rule.validator(rule, a.value, cb, a.source, options);
        }
        var errors = res;
        fieldsSchema = _extends(_extends({}, fieldsSchema), a.rule.fields);
        var schema = new Schema(fieldsSchema);
        schema.messages(options.messages);
        // 利用validate递归的doIt
        schema.validate(a.value, a.rule.options || options, function (errs) {
          var finalErrors = [];
          // 最后所有的error都完善一个遍，就reject
          total++;
          callback(finalErrors, fields);
          if (total === results.length) {
            reject(
              new AsyncValidationError(results, convertFieldsError(results)),
            );
          }
        });
      });
    });
    pending['catch'](function (e) {
      return e;
    });
    return pending;
  },
};

// 异步和同步怎么区别

Schema.prototype = {
  validate: function validate(source, options, callback) {
    function complete(results) {
      callback(errors, fields);
    }

    var series = {};

    var errorFields = {};

    return asyncMap(
      series,
      options,
      function (data, doIt) {
        function cb(e) {
          var errors = e;
          doIt();
          fieldsSchema = _extends(_extends({}, fieldsSchema), data.rule.fields);

          var schema = new Schema(fieldsSchema);
          schema.messages(options.messages);
          // 利用validate递归的doIt
          schema.validate(data.value, data.rule.options || options, function (
            errs,
          ) {
            var finalErrors = [];
            doIt(finalErrors.length ? finalErrors : null);
          });
        }

        var res;

        if (rule.asyncValidator) {
          res = rule.asyncValidator(rule, data.value, cb, data.source, options);
        } else if (rule.validator) {
          res = rule.validator(rule, data.value, cb, data.source, options);
        }
        cb(res);
      },
      function (results) {
        complete(results);
      },
    );
  },
};
