const path = require('path')
const mime = require('mime')
const CryptoJS = require('crypto-js')

const upload = async (options, img, ctx) => {
  const key = getKey(options.filePath, options.prefix, options.fileName)
  const mimeType = getMimeType(options.filePath)
  let stringToSign = 'PUT\n\n' + mimeType + '\n\n/' + options.bucket + '/' + key
  let hash = CryptoJS.HmacSHA1(stringToSign, options.privateKey)
  let signature = CryptoJS.enc.Base64.stringify(hash)
  let token = 'UCloud ' + options.publicKey + ':' + signature
  const fileUrl = 'https://' + options.bucket + options.domain + '/' + key
  await ctx.request({
    method: 'PUT',
    url: fileUrl,
    headers: {
      'Authorization': token,
      'Content-Length': img.buffer.length,
      'Content-Type': mimeType
    },
    body: img.buffer
  })

  return getFileUrl(fileUrl, key, options.cdnDomain)
}

const getMimeType = (filePath) => {
  const ret = mime.getType(filePath)
  if (!ret) {
    return 'application/octet-stream'
  }
  return ret
}

const getKey = (filePath, prefix = '', fileRename) => {
  filePath = filePath.replace(/\\/g, '/')
  prefix = !prefix || prefix.endsWith('/') ? prefix : prefix + '/'
  fileRename = fileRename ? `${fileRename}${fileRename.indexOf('.') !== -1 ? '' : path.extname(filePath)}`
    : path.basename(filePath)
  let key = prefix + fileRename
  return key
}

const getFileUrl = (fileUrl, key, cdnDomain) => {
  return !cdnDomain ? fileUrl : cdnDomain + '/' + key
}

module.exports = { upload }
