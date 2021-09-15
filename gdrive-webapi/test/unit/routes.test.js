import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { logger } from '../../src/logger.js'
import Routes from '../../src/routes.js'
import UploadHandler from '../../src/uploadHandler.js'
import TestUtil from '../util/testUtil.js'

describe('#Routes suite test', () => {
  beforeEach(() => {
    jest.spyOn(logger, 'info')
      .mockImplementation()
  })

  const req = TestUtil.generateReadableStream(['some file bytes'])
  const res = TestUtil.generateWritableStream(() => {})
  const defaultParams = {
    req: Object.assign(req, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      method: '',
      body: {}
    }),
    res: Object.assign(res, {
      setHeader: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn()
    }),
    values: () => Object.values(defaultParams)
  }
  describe('#setSocketInstance', () => {
    test('setSocket should store io instance', () => {
      const routes = new Routes()

      const ioObj = {
        to: (id) => ioObj,
        emit: (event, message) => {}
      }

      routes.setSocketInstance(ioObj)

      expect(routes.io).toStrictEqual(ioObj)
    })
  })

  describe('#handler', () => {
    test('given an inexistent route it should choose default route', async () => {
      const routes = new Routes()
      const params = { ... defaultParams }

      params.req.method = 'inexistent'
      await routes.handler(...params.values())
      expect(params.res.end).toHaveBeenCalledWith('hello world')
    })

    test('it should set any request with CORS enabled', async () => {
      const routes = new Routes()
      const params = { ... defaultParams }

      params.req.method = 'inexistent'
      await routes.handler(...params.values())
      expect(params.res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
    })

    test('given method OPTIONS it should choose options route', async () => {
      const routes = new Routes()
      const params = { ... defaultParams }

      params.req.method = 'OPTIONS'
      await routes.handler(...params.values())
      expect(params.res.writeHead).toHaveBeenCalledWith(204)
      expect(params.res.end).toHaveBeenCalled()
    })

    test('given method POST it should choose options route', async () => {
      const routes = new Routes()
      const params = { ... defaultParams }

      params.req.method = 'POST'
      jest.spyOn(routes, routes.post.name).mockResolvedValue()

      await routes.handler(...params.values())

      expect(routes.post).toHaveBeenCalled()
    })

    test('given method GET it should choose options route', async () => {
      const routes = new Routes()
      const params = { ... defaultParams }

      params.req.method = 'GET'
      jest.spyOn(routes, routes.get.name).mockResolvedValue()

      await routes.handler(...params.values())

      expect(routes.get).toHaveBeenCalled()
    })
  })

  describe('#get', () => {
    test('given method GET it should list all files downloaded', async () => {
      const routes = new Routes()
      const params = { ...defaultParams }

      const filesStatusesMock = [
        {
          size: '1.2 MB',
          lastModified: '2021-09-07T19:17:02.625Z',
          owner: 'danil',
          file: 'demo.gif'
        }
      ]

      jest.spyOn(routes.fileHelper, routes.fileHelper.getFilesStatus.name)
        .mockResolvedValue(filesStatusesMock)

      params.req.method = 'GET'

      await routes.handler(...params.values())

      expect(params.res.writeHead).toHaveBeenCalledWith(200)
      expect(params.res.end).toHaveBeenCalledWith(JSON.stringify(filesStatusesMock))
    })
  })

  describe("#post", () => {
    test('should validate post route workflow', async () => {
      const routes = new Routes('/tmp')
      const opts = { ... defaultParams }
      opts.req.method = 'POST'
      opts.req.url = '?socketId=20'

      jest.spyOn(UploadHandler.prototype, UploadHandler.prototype.registerEvents.name)
        .mockImplementation((headers, onFinish) => {
          const writable = TestUtil.generateWritableStream(() => {})
          
          writable.on('finish', onFinish)

          return writable
        })

        await routes.handler(...opts.values())

        expect(UploadHandler.prototype.registerEvents).toHaveBeenCalled()
        expect(opts.res.writeHead).toHaveBeenCalledWith(200)

        const expectResult = JSON.stringify({ result: 'Files uploaded with success'})
        expect(opts.res.end).toHaveBeenCalledWith(expectResult)
    })
  })
})