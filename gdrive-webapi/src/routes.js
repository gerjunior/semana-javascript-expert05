import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

import FileHelper from './fileHelper.js'
import { logger } from './logger.js'

const DIRNAME = dirname(fileURLToPath(import.meta.url))
const defaultDownloadsFolder = resolve(DIRNAME, '..', 'downloads')

export default class Routes {
  io

  constructor(downloadsFolder = defaultDownloadsFolder) {
    this.downloadsFolder = downloadsFolder
    this.fileHelper = FileHelper
  }

  setSocketInstance(io) {
    this.io = io
  }

  async defaultRoute(request, response) {
    response.end('hello world')
  }

  async options(request, response) {
    response.writeHead(204)
    response.end()
  }

  async post(request, response) {
    logger.info('ae post')
    response.end()
  }

  async get(request, response) {
    const files = await FileHelper.getFilesStatus(this.downloadsFolder)

    response.writeHead(200)
    response.end(JSON.stringify(files))
  }

  handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*')
    const chosenRoute = this[request.method.toLowerCase()] || this.defaultRoute

    return chosenRoute.apply(this, [request, response])
  }
}
