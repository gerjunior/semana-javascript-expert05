import { describe, it, expect, jest } from '@jest/globals'

import Routes from '../../src/routes.js'
import UploadHandler from '../../src/uploadHandler.js'
import TestUtil from '../_util/testUtil.js'

describe('#Routes test suite', () => {
  const request = TestUtil.generateReadableStream(['some file bytes'])
  const response = TestUtil.generateWritableStream(() => {})

  const defaultParams = {
    request: Object.assign(request, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      method: '',
      body: {},
    }),
    response: Object.assign(response, {
      setHeader: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn(),
    }),
    values: () => Object.values(defaultParams),
  }

  describe('#setSocket', () => {
    it('setSocket should store io instance', () => {
      const routes = new Routes()

      const ioObj = {
        to: (_id) => ioObj,
        emit: (_event, _message) => {},
      }

      routes.setSocketInstance(ioObj)

      expect(routes.io).toStrictEqual(ioObj)
    })
  })

  describe('#handler', () => {
    it('should choose default route given an inexistent route', async () => {
      const routes = new Routes()
      const params = {
        ...defaultParams,
      }

      params.request.method = 'NOPE'
      await routes.handler(...params.values())

      expect(params.response.end).toHaveBeenCalledWith('hello world')
    })

    it('should set any request with CORS enabled', async () => {
      const routes = new Routes()
      const params = {
        ...defaultParams,
      }

      params.request.method = 'NOPE'
      await routes.handler(...params.values())

      expect(params.response.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
    })

    it('given method OPTIONS it should choose options route', async () => {
      const routes = new Routes()
      const params = {
        ...defaultParams,
      }

      params.request.method = 'OPTIONS'
      await routes.handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(204)
      expect(params.response.end).toHaveBeenCalled()
    })
    it('given method POST it should choose post route', async () => {
      const routes = new Routes()
      const params = {
        ...defaultParams,
      }

      params.request.method = 'POST'
      jest.spyOn(routes, routes.post.name).mockResolvedValue()

      await routes.handler(...params.values())

      expect(routes.post).toHaveBeenCalled()
    })

    it('given method GET it should choose get route', async () => {
      const routes = new Routes()
      const params = {
        ...defaultParams,
      }

      params.request.method = 'GET'
      jest.spyOn(routes, routes.get.name).mockResolvedValue()

      await routes.handler(...params.values())

      expect(routes.get).toHaveBeenCalled()
    })
  })

  describe('#get', () => {
    it('should list all files downloaded given the GET method', async () => {
      const router = new Routes()
      const params = {
        ...defaultParams,
      }

      const filesStatusesMock = [
        {
          size: '13.3 kB',
          lastModified: '2022-04-22T16:58:27.589Z',
          owner: 'geraldo',
          file: 'file.txt',
        },
      ]

      jest.spyOn(router.fileHelper, router.fileHelper.getFilesStatus.name).mockResolvedValue(filesStatusesMock)

      params.request.method = 'GET'
      await router.handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(200)
      expect(params.response.end).toHaveBeenCalledWith(JSON.stringify(filesStatusesMock))
    })
  })

  describe('#post', () => {
    it('should validate post route workflow', async () => {
      const routes = new Routes('/tmp')
      const options = {
        ...defaultParams,
      }

      options.request.method = 'POST'
      options.request.url = '?socketId=10'

      jest
        .spyOn(UploadHandler.prototype, UploadHandler.prototype.registerEvents.name)
        .mockImplementation((headers, onFinish) => {
          const writable = TestUtil.generateWritableStream(() => {})
          writable.on('finish', onFinish)

          return writable
        })

      await routes.handler(...options.values())

      expect(UploadHandler.prototype.registerEvents).toHaveBeenCalled()
      expect(options.response.writeHead).toHaveBeenCalledWith(200)

      const expectedResult = JSON.stringify({ result: 'Files uploaded with success!' })
      expect(options.response.end).toHaveBeenCalledWith(expectedResult)
    })
  })
})
