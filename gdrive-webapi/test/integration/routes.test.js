import { describe, test, expect, jest, afterAll } from '@jest/globals'
import fs from 'fs'
import FormData from 'form-data'
import TestUtil from '../util/testUtil.js'
import { logger } from '../../src/logger.js'
import Routes from '../../src/routes.js'
import { tmpdir } from 'os'
import { join } from 'path'

describe('#Routes integration test', () => {
  let defaultDownloadsFolder = ''

  afterAll(async () => {
    await fs.promises.rm(defaultDownloadsFolder, { recursive: true })
  })

  beforeEach(() => {
    jest.spyOn(logger, 'info')
      .mockImplementation()
  })

  describe('#uploadFile', () => {
    const ioObj = {
      to: (id) => ioObj,
      emit: (event, message) => {}
    }

    test('should upload file to the folder', async () => {
      defaultDownloadsFolder = await fs.promises.mkdtemp(join(tmpdir(), 'downloads-'))
      
      const filename = 'demo.gif'
      const fileStream = fs.createReadStream(`./test/integration/mocks/${filename}`)
      const response = TestUtil.generateWritableStream(() => {})
      const form = new FormData()
      
      form.append('photo', fileStream)
      
      const defaultParams = {
        req: Object.assign(form, {
          headers: form.getHeaders(),
          method: 'POST',
          url: '?socketId=10'
        }),
        res: Object.assign(response, {
          setHeader: jest.fn(),
          writeHead: jest.fn(),
          end: jest.fn()
        }),
        values: () => Object.values(defaultParams)
      }
      
      const routes = new Routes(defaultDownloadsFolder)

      routes.setSocketInstance(ioObj)

      const dirBeforeRan = await fs.promises.readdir(defaultDownloadsFolder)
      expect(dirBeforeRan).toEqual([])

      
      await routes.handler(...defaultParams.values())

      const dirAfterRan = await fs.promises.readdir(defaultDownloadsFolder)
      expect(dirAfterRan).toEqual([filename])

      expect(defaultParams.res.writeHead).toHaveBeenCalledWith(200)

      const expectResult = JSON.stringify({ result: 'Files uploaded with success'})
      expect(defaultParams.res.end).toHaveBeenCalledWith(expectResult)
    })
  })
})