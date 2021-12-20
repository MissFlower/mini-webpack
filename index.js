const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const { transformFromAstSync } = require('@babel/core')
const ejs = require('ejs')
let id = 1

let globalConfig

// 获取文件依赖关系
function createAssert(path) {
  // 1、获取入口文件资源
  let source = fs.readFileSync(path, 'utf-8')
  // console.log(source)
  // 处理loader
  const loaders = globalConfig.module.rules
  loaders.forEach(loader => {
    const { test, use } = loader
    if (test.test(path)) {
      source = use(source)
    }
  })
  // 2、获取文件的依赖关系
  const ast = parser.parse(source, {
    sourceType: 'module'
  })

  const deps = []
  traverse(ast, {
    ImportDeclaration({ node }) {
      // 获取依赖文件路径
      deps.push(node.source.value)
    }
  })

  // babel.transformFromAst(ast: Object, code?: string, options?: Object, callback: Function): FileNode | null
  const { code } = transformFromAstSync(ast, null, {
    // presets: [["@babel/preset-env", { "targets": "defaults" }]]
    presets: ['env']
  })
  // console.log(code)

  const res = {
    id: id++,
    code,
    deps,
    path,
    mapping: {}
  }
  return res
}

function recursionCreateDepend(sourceAsset, queue, dirPath) {
  if (sourceAsset.deps.length) {
    sourceAsset.deps.forEach(relativePath => {
      const childSourceAsset = createAssert(path.resolve(dirPath, relativePath))
      sourceAsset.mapping[relativePath] = childSourceAsset.id
      queue.push(childSourceAsset)
      recursionCreateDepend(childSourceAsset, queue, dirPath)
    })
  }
}

function createGraph(entryPath) {
  const sourceAsset = createAssert(entryPath)
  const dirPath = path.dirname(entryPath)
  const queue = [sourceAsset]

  recursionCreateDepend(sourceAsset, queue, dirPath)
  // console.log(queue)
  // return
  return queue
}

function createModules(graph) {
  const modules = {}
  graph.forEach(asset => {
    modules[asset.id] = [asset.code, asset.mapping]
  })

  return modules
}
function build(graph) {
  const modules = createModules(graph)
  // console.log(modules)

  const bundleTemplete = fs.readFileSync('./bundleTemplete.ejs', 'utf-8')

  const code = ejs.render(bundleTemplete, {
    modules
  })

  function emitFile(context) {
    fs.writeFileSync('./example/dist/bundle.js', context)
  }

  emitFile(code)
}

function mdLoader(source) {
  console.log(source)

  return `export default 'this is a md file'`
}

const config = {
  entry: './example/main.js',
  module: {
    rules: [
      {
        test: /\.md$/,
        use: mdLoader
      }
    ]
  }
}
function webpack(config) {
  globalConfig = config
  const graph = createGraph(config.entry)

  build(graph)
}
webpack(config)
