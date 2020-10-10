'use strict';

const fs = require('fs-extra');
const path = require('path');
const libs = require('nodex-libs');

class Runtime {

  constructor(cwd) {
    this.cwd = cwd
    this.args = this.loadArgs(cwd)
  }

  loadArgs(basePath) {
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

  async loadPath(prop, targetPath) {
    targetPath = path.join(this.cwd, targetPath)
    this[prop] = await this._loadPath(targetPath, this.args)
    return this
  }

  async _loadPath(targetPath, args, module = {}) {
    if((await fs.pathExists(targetPath)) && (await fs.stat(targetPath)).isDirectory()) {
      for(let childPath of (await fs.readdir(targetPath))){
        const childPathBaseName = path.basename(path.join(targetPath, childPath.replace('index.js', '')), '.js')
        const targetPathBaseName = path.basename(targetPath)
        if (childPathBaseName !== targetPathBaseName) {
          module[targetPathBaseName] = module[targetPathBaseName] || {}
          module[targetPathBaseName][childPathBaseName] = module[targetPathBaseName][childPathBaseName] || {}
          Object.assign(module[targetPathBaseName], await this._loadPath(path.join(targetPath, childPath), args[targetPathBaseName] ,module[targetPathBaseName][childPathBaseName]))
        } else {
          module[childPathBaseName] = await this._loadPath(path.join(targetPath, childPath), args[targetPathBaseName], module[targetPathBaseName])
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
  
    if (nModule.init) {
     await nModule.init(args[basename])
    }
    return module
  }
}

module.exports = async (cwd = '.') => {
  cwd = path.resolve(cwd)
  global.nodex = Object.create(null)
  Object.defineProperty(nodex, 'libs', {
    writable: false,
    value: libs
  })
  Object.defineProperty(nodex, 'runtime', {
    writable: false,
    value: new Runtime(cwd)
  })

  await nodex.runtime.loadPath('data', 'src/data')
  await nodex.runtime.loadPath('logic', 'src/logic')
  await nodex.runtime.loadPath('serv', 'src/serv')
  nodex.runtime.serv.start(nodex.runtime.args.serv)
}