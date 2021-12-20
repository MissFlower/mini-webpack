import { reduce } from './bar.js'
import { add } from './foo.js'
// @ts-ignore
import md from './test.md'
console.log('main')
console.log(add(2, 1))
console.log(reduce(2, 1))
console.log(md)
