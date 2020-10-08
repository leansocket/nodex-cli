'use strict';

const fs = require('fs-extra');
const path = require('path');

const loadArgs = function (basePath) {

  const env = process.env.NODE_ENV || 'prod'
  const argsPath = path.join(basePath, 'data', `args-${env}.json`);;

  if (fs.existsSync(argsPath)) {
      return require(argsPath);
  }
  else {
      console.log(`ignored args file: '${argsPath}' because it is not found.`);
  }

  return null;

}

const loadPath = async function(targetPath, args, module = {}) {
  if (!fs.pathExistsSync(targetPath)) {
    return module
  }

  if(fs.statSync(targetPath).isDirectory()) {
    for(let childPath of fs.readdirSync(targetPath)){
      const childPathBaseName = path.basename(path.join(targetPath, childPath.replace('index.js', '')), '.js')
      const targetPathBaseName = path.basename(targetPath)
      if (childPathBaseName !== targetPathBaseName) {
        module[targetPathBaseName] = module[targetPathBaseName] || {}
        module[targetPathBaseName][childPathBaseName] = module[targetPathBaseName][childPathBaseName] || {}
        Object.assign(module[targetPathBaseName], loadPath(path.join(targetPath, childPath), args[targetPathBaseName] ,module[targetPathBaseName][childPathBaseName]))
      } else {
        module[childPathBaseName] = loadPath(path.join(targetPath, childPath), args[targetPathBaseName], module[targetPathBaseName])
      }
    }
    return module
  }

  if (path.extname(targetPath) === '') {
    targetPath += '.js'
  }
  targetPath = targetPath.replace('/index.js', '')
  const basename = path.basename(targetPath, '.js')
  const nModule = require(targetPath)
  Object.assign(module, nModule)

  nModule.init && (await nModule.init(args[basename]))

  return module
}

module.exports = async (cwd = '.') => {
  global.nodex = require('nodex-libs')
  nodex.runtime = {}
  cwd = path.resolve(cwd)
  const args = loadArgs(cwd)
  nodex.runtime.args = args
  const data = await loadPath(path.join(cwd, 'src', 'data'), args)
  nodex.runtime.data = data
  const logic = await loadPath(path.join(cwd, 'src', 'logic'), args)
  nodex.runtime.logic = logic
  const serv = await loadPath(path.join(cwd, 'src', 'serv'), args)
  nodex.runtime.serv = serv
  await nodex.runtime.serv.start(nodex.runtime.args.serv)
}