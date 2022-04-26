import fs from 'node:fs'
import prettyBytes from 'pretty-bytes'

export default class FileHelper {
  static async getFilesStatus(downloadsFolder) {
    const currentFiles = await fs.promises.readdir(downloadsFolder)
    // eslint-disable-next-line prettier/prettier
    const statuses = await Promise.all(
        currentFiles.map(
            (file) => fs.promises.stat(`${downloadsFolder}/${file}`)
          )
      )

    const filesStatuses = currentFiles.map((file, fileIndex) => {
      const { birthtime, size } = statuses[fileIndex]

      return {
        size: prettyBytes(size),
        file,
        lastModified: birthtime,
        owner: process.env.USER,
      }
    })

    return filesStatuses
  }
}
