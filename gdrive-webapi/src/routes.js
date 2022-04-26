import { dirname, resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath, parse } from 'node:url'

import FileHelper from './fileHelper.js'
import { logger } from './logger.js'
import UploadHandler from './uploadHandler'

const DIRNAME = dirname(fileURLToPath(import.meta.url))
const defaultDownloadsFolder = resolve(DIRNAME, '..', 'downloads')

export default class Routes {
  constructor(downloadsFolder = defaultDownloadsFolder) {
    this.downloadsFolder = downloadsFolder
    this.fileHelper = FileHelper
    this.io = {}
  }

  setSocketInstance(io) {
    this.io = io
  }

  async defaultRoute(_request, response) {
    response.end('hello world')
  }

  async options(_request, response) {
    response.writeHead(204)
    response.end()
  }

  async post(request, response) {
    const { headers } = request
    const {
      query: { socketId },
    } = parse(request.url, true)

    const uploadHandler = new UploadHandler({
      socketId,
      io: this.io,
      downloadsFolder: this.downloadsFolder,
    })

    const onFinish = (res) => () => {
      res.writeHead(200)
      const data = JSON.stringify({ result: 'Files uploaded with success!' })
      res.end(data)
    }

    const busboyInstance = uploadHandler.registerEvents(headers, onFinish(response))

    await pipeline(request, busboyInstance)
    logger.info('Request finished with success!')
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
