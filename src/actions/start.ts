'use strict';

import fs from 'fs-extra';
import path from 'path';
import * as libs from 'nodex-libs';

class Runtime {

  private _cwd: string

  private _appInfo

  private _args

  get args() { return this._args }

  get appInfo() { return this._appInfo }

  get cwd() { return this._cwd }

  constructor(cwd: string) {
    this._cwd = cwd
    this._appInfo = this.getAppInfo(cwd)
    this._args = this.loadArgs(cwd)
  }

  private getAppInfo(basePath) {
    const packagePath = path.join(basePath, 'package.json')

    if (!fs.existsSync(packagePath)) {
      throw new Error(`The package.json file '${packagePath}' is not found.`)
    }

    return require(packagePath)
  }

  private loadArgs(basePath) {
    const env = process.env.NODE_ENV || 'prod'
    const argsPath = path.join(basePath, 'data', `args-${env}.json`)
  
    if (!fs.existsSync(argsPath)) {
      throw new Error(`The args file '${argsPath}' is not found.`)
    }

    return require(argsPath)
  }

  public async loadPath(prop, targetPath) {
    targetPath = path.join(this.cwd, targetPath)
    this[prop] = await this._loadPath(targetPath, this.args)
    return this
  }

  private async _loadPath(targetPath, args, module = {}) {
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
  global['nodex'] = Object.create(null)
  Object.defineProperty(global['nodex'], 'libs', {
    writable: false,
    value: libs
  })
  Object.defineProperty(global['nodex'], 'runtime', {
    writable: false,
    value: new Runtime(cwd)
  })

  await global['nodex'].runtime.loadPath('data', 'src/data')
  await global['nodex'].runtime.loadPath('logic', 'src/logic')
  await global['nodex'].runtime.loadPath('serv', 'src/serv')
}

