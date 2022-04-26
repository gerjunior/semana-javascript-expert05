import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'

import UploadHandler from '../../src/uploadHandler'
import TestUtil from '../_util/testUtil'
import { logger } from '../../src/logger'

describe('#UploadHandler test suite', () => {
  const ioObj = {
    to: (_id) => ioObj,
    emit: (_event, _message) => {},
  }

  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation()
  })

  describe('#registerEvents', () => {
    it('should call onFile and onFinish on Busboy instance', () => {
      const uploadHandler = new UploadHandler({ io: ioObj, socketId: '01' })

      jest.spyOn(uploadHandler, uploadHandler.onFile.name).mockResolvedValue()

      const headers = {
        'content-type': 'multipart/form-data; boundary=',
      }

      const fn = jest.fn()
      const busboyInstance = uploadHandler.registerEvents(headers, fn)

      const fileStream = TestUtil.generateReadableStream(['chunk', 'of', 'data'])
      busboyInstance.emit('file', 'fieldname', fileStream, 'filename.txt')

      busboyInstance.listeners('finish')[0].call()

      expect(uploadHandler.onFile).toHaveBeenCalled()
      expect(fn).toHaveBeenCalled()
    })
  })

  describe('#onFile', () => {
    it('should save a stream file on disk', async () => {
      const chunks = ['hey', 'dude']
      const downloadsFolder = '/tmp'
      const handler = new UploadHandler({
        io: ioObj,
        socketId: '01',
        downloadsFolder,
      })

      const onData = jest.fn()
      jest.spyOn(fs, fs.createWriteStream.name).mockImplementation(() => TestUtil.generateWritableStream(onData))

      const onTransform = jest.fn()
      jest
        .spyOn(handler, handler.handleFileBytes.name)
        .mockImplementation(() => TestUtil.generateTransformStream(onTransform))

      const params = {
        fieldname: 'video',
        file: TestUtil.generateReadableStream(chunks),
        filename: 'mockFile.mov',
      }

      await handler.onFile(...Object.values(params))

      expect(onData.mock.calls.join()).toEqual(chunks.join())
      expect(onTransform.mock.calls.join()).toEqual(chunks.join())

      const expectedFileName = path.resolve(handler.downloadsFolder, params.filename)
      expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFileName)
    })
  })

  describe('#handleFileBytes', () => {
    it('should call emit function and it should be a transform stream', async () => {
      jest.spyOn(ioObj, ioObj.to.name)
      jest.spyOn(ioObj, ioObj.emit.name)

      const handler = new UploadHandler({ io: ioObj, socketId: '01' })

      jest.spyOn(handler, handler.canExecute.name).mockReturnValueOnce(true)

      const messages = ['hello']
      const source = TestUtil.generateReadableStream(messages)
      const onWrite = jest.fn()
      const target = TestUtil.generateWritableStream(onWrite)

      await pipeline(source, handler.handleFileBytes('filename.txt'), target)

      expect(ioObj.to).toHaveBeenCalledTimes(messages.length)
      expect(ioObj.emit).toHaveBeenCalledTimes(messages.length)

      /** se o handleFileBytes for um transform stream, nosso pipeline
       * vai continuar o processo, passando os dados para frente
       * e chamar a função target em cada chunk
       */
      expect(onWrite).toHaveBeenCalledTimes(messages.length)
      expect(onWrite.mock.calls.join()).toEqual(messages.join())
    })

    it('should emit only two messages during a 3 seconds period given a message timerDelay of 2secs', async () => {
      jest.spyOn(ioObj, ioObj.emit.name)

      const twoSecondsPeriod = 2000
      const day = '2021-07-01 01:01'
      // ? Date.now do this.lastMessageSent em handleBytes
      const onFirstLastMessageSent = TestUtil.getTimeFromDate(`${day}:00`)
      // ? hello
      const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:02`)
      const onSecondUpdateLastMessageSent = onFirstCanExecute

      // ? hello (second)
      const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:03`)
      // ? world
      const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:04`)

      TestUtil.mockDateNow([
        onFirstLastMessageSent,
        onFirstCanExecute,
        onSecondUpdateLastMessageSent,
        onSecondCanExecute,
        onThirdCanExecute,
      ])

      const messages = ['hello', 'hello', 'world']
      const filename = 'filename.avi'
      const expectedMessagesSent = 2

      const source = TestUtil.generateReadableStream(messages)
      const handler = new UploadHandler({ io: ioObj, socketId: '01', messageTimeDelay: twoSecondsPeriod })

      await pipeline(source, handler.handleFileBytes(filename))

      expect(ioObj.emit).toHaveBeenCalledTimes(expectedMessagesSent)

      const [firstCallResult, secondCallResult] = ioObj.emit.mock.calls
      expect(firstCallResult).toEqual([handler.ON_UPLOAD_EVENT, { processedAlready: 'hello'.length, filename }])
      expect(secondCallResult).toEqual([
        handler.ON_UPLOAD_EVENT,
        { processedAlready: messages.join('').length, filename },
      ])
    })
  })

  describe('#canExecute', () => {
    it('should return true when time is later than specified delay', () => {
      const timerDelay = 1000
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimeDelay: timerDelay,
      })

      const tickNow = TestUtil.getTimeFromDate('2021-07-01 00:00:03')
      TestUtil.mockDateNow([tickNow])

      const lastExecution = TestUtil.getTimeFromDate('2021-07-01 00:00:00')

      const result = uploadHandler.canExecute(lastExecution)
      expect(result).toBeTruthy()
    })
    it('should return false when time isnt later than specified delay', () => {
      const timerDelay = 3000
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimeDelay: timerDelay,
      })

      const tickNow = TestUtil.getTimeFromDate('2021-07-01 00:00:02')
      TestUtil.mockDateNow([tickNow])

      const lastExecution = TestUtil.getTimeFromDate('2021-07-01 00:00:01')

      const result = uploadHandler.canExecute(lastExecution)
      expect(result).toBeFalsy()
    })
  })
})
