import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import UploadHandler from '../../src/uploadHandler'
import TestUtil from '../util/testUtil'
import fs from 'fs'
import { pipeline } from 'stream/promises'
import { logger } from '../../src/logger'

describe('#UploadHandler suite test', () => {
  const ioObj = {
    to: (id) => ioObj,
    emit: (event, message) => {}
  }

  beforeEach(() => {
    jest.spyOn(logger, 'info')
      .mockImplementation()
  })

  describe('#registerEvents', () => {
    test('should call onFile and onFinish functions on busbou instance', () => {
      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '32'
      })

      jest.spyOn(uploadHandler, uploadHandler.onFile.name)
        .mockResolvedValue()

      const headers = {
        'content-type': 'multipart/form-data; boundary='
      }

      const onFinish = jest.fn()
      const busBoyInstance = uploadHandler.registerEvents(headers, onFinish)

      const fileStream = TestUtil.generateReadableStream(['data', 'baba', 'laca'])
      busBoyInstance.emit('file', 'fieldname', fileStream, 'filename.txt')

      busBoyInstance.listeners("finish")[0].call()

      expect(uploadHandler.onFile).toHaveBeenCalled()
      expect(onFinish).toHaveBeenCalled()
    })
  })

  describe('#onFile', () => {
    test('given a stream file it should save it on disk', async () => {
      const chunks = ['blabla', 'dada']
      const downloadsFolder = '/tmp'
      const handler = new UploadHandler({
        io: ioObj,
        socketId: '32',
        downloadsFolder
      })

      const onData = jest.fn()
      jest.spyOn(fs, fs.createWriteStream.name)
        .mockImplementation(() => TestUtil.generateWritableStream(onData))

      const onTransform = jest.fn()
      jest.spyOn(handler, handler.handleFileBytes.name)
        .mockImplementation(() => TestUtil.generateTransformStream(onTransform))

      const params = {
        fieldname: 'video',
        file: TestUtil.generateReadableStream(chunks),
        filename: 'video.mov'
      }

      await handler.onFile(...Object.values(params))

      expect(onData.mock.calls.join()).toEqual(chunks.join())
      expect(onTransform.mock.calls.join()).toEqual(chunks.join())

      const expectedFilename = `${handler.downloadsFolder}/${params.filename}`
      expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFilename)
    })
  })

  describe('#handleFileBytes', () => {
    test('should call emit function and it is a transform stream', async () => {
      jest.spyOn(ioObj, ioObj.to.name)
      jest.spyOn(ioObj, ioObj.emit.name)

      const handler =  new UploadHandler({
        io: ioObj,
        socketId: '32'
      })

      jest.spyOn(handler, handler.canExecute.name)
        .mockReturnValueOnce(true)

      const messages = ['hello']
      const source = TestUtil.generateReadableStream(messages)
      const onWrite = jest.fn()
      const target = TestUtil.generateWritableStream(onWrite) 

      // console.log(source)

      await pipeline(source, handler.handleFileBytes('a.txt'), target)

      expect(ioObj.to).toHaveBeenCalledTimes(messages.length)
      expect(ioObj.emit).toHaveBeenCalledTimes(messages.length)

      expect(onWrite).toHaveBeenCalledTimes(messages.length)
      expect(onWrite.mock.calls.join()).toEqual(messages.join())
    })

    test('given message timerDelay as 2 secs it should emit only two messages on message during 3 seconds period', async () => {
      jest.spyOn(ioObj, ioObj.emit.name)

      const day = '2021-09-07 00:00'
      const onInitVariable = TestUtil.getTimeFromDate(`${day}:00`)
      const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:02`)
      const onSecondUpdateLastMessageSent = onFirstCanExecute
      const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:03`)
      const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:04`)

      TestUtil.mockDateNow([ onInitVariable, onFirstCanExecute, onSecondUpdateLastMessageSent, onSecondCanExecute, onThirdCanExecute ])

      const handler =  new UploadHandler({
        io: ioObj,
        socketId: '32',
        messageTimeDelay: 2000
      })

      const messages = ['hello', 'hello', 'world']
      const expectedMessageSent = 2
      const filename = 'arc.mp4'

      const source = TestUtil.generateReadableStream(messages)
      await pipeline(source, handler.handleFileBytes(filename))

      expect(ioObj.emit).toHaveBeenCalledTimes(expectedMessageSent)

      const [firstCallRes, secondCallRes] = ioObj.emit.mock.calls
      expect(firstCallRes).toEqual([handler.ON_UPLOAD_EVENT, { processedAlready: "hello".length, filename }])
      expect(secondCallRes).toEqual([handler.ON_UPLOAD_EVENT, { processedAlready: messages.join('').length, filename }])
    })
  })

  describe('#canExecute', () => {
    test('should return true when time is later than specified delay', () => {
      const timerDelay = 1000
      const handler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimeDelay: timerDelay
      })
      const tickNow = TestUtil.getTimeFromDate('2021-09-07 00:00:03')
      TestUtil.mockDateNow([tickNow])
      const tickBefore = TestUtil.getTimeFromDate('2021-09-07 00:00:00')
      const lastExecution = tickBefore

      const result = handler.canExecute(lastExecution)

      expect(result).toBeTruthy()
    })
    test('should return false when time isnt later than specified delay', () => {
      const timerDelay = 3000
      const handler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimeDelay: timerDelay
      })
      const tickNow = TestUtil.getTimeFromDate('2021-09-07 00:00:02')
      TestUtil.mockDateNow([tickNow])

      const lastExecution = TestUtil.getTimeFromDate('2021-09-07 00:00:01')

      const result = handler.canExecute(lastExecution)

      expect(result).toBeFalsy()
    })
  })
})