import fs from 'fs'
import { describe, it, expect, jest } from '@jest/globals'

import FileHelper from '../../src/fileHelper.js'

describe('#FileHelper', () => {
  describe('#getFileStatus', () => {
    it('should return files statuses in the correct format', async () => {
      const statMock = {
        dev: 16777232,
        mode: 33188,
        nlink: 1,
        uid: 501,
        gid: 20,
        rdev: 0,
        blksize: 4096,
        ino: 17061504,
        size: 13264,
        blocks: 32,
        atimeMs: 1650646707588.7998,
        mtimeMs: 1650646707589.2246,
        ctimeMs: 1650646707590.389,
        birthtimeMs: 1650646707588.7998,
        atime: '2022-04-22T16:58:27.589Z',
        mtime: '2022-04-22T16:58:27.589Z',
        ctime: '2022-04-22T16:58:27.590Z',
        birthtime: '2022-04-22T16:58:27.589Z',
      }

      const mockUser = 'geraldo'
      process.env.USER = mockUser
      const filename = 'file.png'

      jest.spyOn(fs.promises, fs.promises.stat.name).mockResolvedValue(statMock)
      jest.spyOn(fs.promises, fs.promises.readdir.name).mockResolvedValue([filename])

      const result = await FileHelper.getFilesStatus('/tmp')

      const expectedResult = [
        {
          size: '13.3 kB',
          lastModified: statMock.birthtime,
          owner: mockUser,
          file: filename,
        },
      ]

      expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${filename}`)
      expect(result).toMatchObject(expectedResult)
    })
  })
})
