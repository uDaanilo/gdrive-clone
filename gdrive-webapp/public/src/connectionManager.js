export default class ConnectionManager {
  constructor({ apiUrl }) {
    this.apiUrl = apiUrl
    
    this.ioClient = io.connect(apiUrl, { withCredentials: false })
    this.socketId = ''
  }

  configureEvents({ onProgress }) {
    this.ioClient.on('connect', this.onConnect.bind(this))
    this.ioClient.on('file-upload', onProgress)
  }

  onConnect(msg) {
    console.log('CONNECTED', this.ioClient.id)
    this.socketId = this.ioClient.id
  }

  async uploadFile(file) {
    const form = new FormData()

    form.append('files', file)

    const res = await fetch(`${this.apiUrl}?socketId=${this.socketId}`, {
      method: 'POST',
      body: form
    })

    return res.json()
  }

  async currentFiles () {
    const files = await (await fetch(this.apiUrl)).json()

    return files
  }
}