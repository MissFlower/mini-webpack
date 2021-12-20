// 如何将esm转换成cjs的语法
;(function(modules) {
  function require(path) {
    const module = {
      exports: {}
    }

    const fn = modules[path]
    fn(require, modules, module.exports)

    return module.exports
  }
  require('./main.js')
})(
  {
    './foo.js': function (require, modules, exports) {
      exports.add = function (a, b) {
        return a + b
      }
    },
    './main.js': function (require, modules, exports) {
      // import {add} from './foo.js'
      const {add} = require('./foo.js')
      console.log('main')
      console.log(add(2, 1))
    }
  }
)