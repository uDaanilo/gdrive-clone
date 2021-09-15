import { describe, test, expect, jest } from '@jest/globals'
import fs from 'fs'
import FileHelper from '../../src/fileHelper.js'

describe('#FileHelper', () => {
  describe('#getFileStatus', () => {
    test('it should return files statuses in correct format', async () => {
      const statMock = {
        dev: 740638404,
        mode: 33206,
        nlink: 1,
        uid: 0,
        gid: 0,
        rdev: 0,
        blksize: 4096,
        ino: 17732923533116876,
        size: 1195211,
        blocks: 2336,
        atimeMs: 1631045369130.8904,
        mtimeMs: 1631045369033,
        ctimeMs: 1631045369034.1418,
        birthtimeMs: 1631042222624.8943,
        atime: '2021-09-07T20:09:29.131Z',
        mtime: '2021-09-07T20:09:29.033Z',
        ctime: '2021-09-07T20:09:29.034Z',
        birthtime: '2021-09-07T19:17:02.625Z'
      }

      const mockUser = 'danilo'
      process.env.USER = mockUser
      const filename = 'demo.gif'

      jest.spyOn(fs.promises, fs.promises.readdir.name)
        .mockResolvedValue([filename])
      
      jest.spyOn(fs.promises, fs.promises.stat.name)
        .mockResolvedValue(statMock)

      const result = await FileHelper.getFilesStatus("/tmp")

      const expectedResult = [
        {
          size: '1.2 MB',
          lastModified: statMock.birthtime,
          owner: mockUser,
          file: filename
        }
      ]

      expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${filename}`)
      expect(result).toMatchObject(expectedResult)
    })
  })
})