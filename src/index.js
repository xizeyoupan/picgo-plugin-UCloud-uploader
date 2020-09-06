const UFile = require('@charbo/ufile-node-sdk')

const handle = async (ctx) => {
  const UCloudOptions = ctx.getConfig('picBed.UCloud-uploader')
  if (!UCloudOptions) {
    throw new Error('找不到UCloud图床配置文件')
  }
  const uFile = new UFile({
    publicKey: UCloudOptions.publicKey,
    privateKey: UCloudOptions.privateKey,
    bucket: UCloudOptions.bucket,
    protocol: 'https',
    domain: UCloudOptions.domain,
    cdnDomain: UCloudOptions.cdnDomain
  })

  await Promise.all(ctx.output.map(async (i) => {
    i.imgUrl = (await uFile.putFile({ fileRename: i.fileName, filePath: ctx.input[ctx.output.indexOf(i)], prefix: UCloudOptions.prefix })).url
  })).catch(error => {
    ctx.emit('notification', {
      title: '上传错误',
      body: JSON.stringify(error.msg)
    })

    throw error.msg
  })

  return ctx
}

const config = (ctx) => {
  let userConfig = ctx.getConfig('picBed.UCloud-uploader')
  if (!userConfig) {
    userConfig = {}
  }
  return [
    {
      name: 'publicKey',
      type: 'input',
      default: userConfig.publicKey || '',
      message: 'PublicKey 不能为空',
      required: true
    },
    {
      name: 'privateKey',
      type: 'password',
      default: userConfig.privateKey || '',
      message: 'PrivateKey 不能为空',
      required: true
    },
    {
      name: 'bucket',
      type: 'input',
      default: userConfig.bucket || '',
      message: 'Bucket 不能为空',
      required: true
    },
    {
      name: 'domain',
      type: 'input',
      alias: '存储空间域名',
      default: userConfig.domain || '',
      message: '存储空间域名代码不能为空，包括点，例如`.cn-sh2.ufileos.com`',
      required: true
    },
    {
      name: 'prefix',
      type: 'input',
      alias: '存储路径',
      message: '远端存储路径，例如`test/`',
      default: userConfig.prefix || '',
      required: false
    },
    {
      name: 'cdnDomain',
      type: 'input',
      alias: '自定义域名',
      default: userConfig.cdnDomain || '',
      required: false
    }
  ]
}

module.exports = (ctx) => {
  const register = () => {
    ctx.helper.uploader.register('UCloud-uploader', {
      handle,
      name: 'UCloud对象存储',
      config: config
    })
  }
  return {
    uploader: 'UCloud-uploader',
    register
  }
}
