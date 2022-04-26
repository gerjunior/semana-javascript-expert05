import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import os from 'node:os'

import { describe, it, expect, jest, beforeEach, beforeAll, afterAll } from '@jest/globals'
import FormData from 'form-data'

import Routes from '../../src/routes.js'
import TestUtil from '../_util/testUtil.js'
import { logger } from '../../src/logger'

const DIRNAME = path.dirname(fileURLToPath(import.meta.url))

describe('#Routes Integration test suite', () => {
  let defaultDownloadsFolder = ''

  beforeAll(async () => {
    defaultDownloadsFolder = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'downloads-'))
  })

  afterAll(async () => {
    defaultDownloadsFolder = await fs.promises.rm(defaultDownloadsFolder, { recursive: true })
  })

  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation()
  })

  describe('#getFileStatus', () => {
    const ioObj = {
      to: (_id) => ioObj,
      emit: (_event, _message) => {},
    }

    it('should upload file to the folder', async () => {
      const filename = 'house_and_keys.jpeg'
      const fileStream = fs.createReadStream(path.resolve(DIRNAME, 'mocks', filename))
      const response = TestUtil.generateWritableStream(() => {})

      const form = new FormData()
      form.append('photo', fileStream)

      const defaultParams = {
        request: Object.assign(form, {
          headers: form.getHeaders(),
          method: 'POST',
          url: '?socketId=10',
        }),
        response: Object.assign(response, {
          setHeader: jest.fn(),
          writeHead: jest.fn(),
          end: jest.fn(),
        }),
        values: () => Object.values(defaultParams),
      }

      const routes = new Routes(defaultDownloadsFolder)
      routes.setSocketInstance(ioObj)
      const dirBeforeRun = await fs.promises.readdir(defaultDownloadsFolder)
      expect(dirBeforeRun).toEqual([])

      await routes.handler(...defaultParams.values())
      const dirAfterRun = await fs.promises.readdir(defaultDownloadsFolder)
      expect(dirAfterRun).toEqual([filename])

      expect(defaultParams.response.writeHead).toHaveBeenCalledWith(200)
      const expectedResult = JSON.stringify({ result: 'Files uploaded with success!' })
      expect(defaultParams.response.end).toHaveBeenCalledWith(expectedResult)
    })
  })
})
