var express = require('express')
var app = express()
var request = require('request')
var cheerio = require('cheerio')
var child_process = require('child_process')

function deviceData() {
  var baseUrl = 'http://192.168.10.173:5004'
  var manufacturer = 'Silicondust'
  var modelNumber = 'HDTC-2US'
  var deviceId = '12345678'
  var friendlyName = 'plexDvr'

  return `
    <root xmlns="urn:schemas-upnp-org:device-1-0">
        <specVersion>
            <major>1</major>
            <minor>0</minor>
        </specVersion>
        <URLBase>${baseUrl}</URLBase>
        <device>
            <deviceType>urn:schemas-upnp-org:device:MediaServer:1</deviceType>
            <friendlyName>${friendlyName}</friendlyName>
            <manufacturer>${manufacturer}</manufacturer>
            <modelName>${modelNumber}</modelName>
            <modelNumber>${modelNumber}</modelNumber>
            <serialNumber></serialNumber>
            <UDN>uuid:${deviceId}</UDN>
        </device>
    </root>
    `
}

app.get('/', function (req, res) {
  res.send(deviceData())
})

app.get('/device.xml', function (req, res) {
  res.send(deviceData())
})

app.get('/discover.json', function (req, res) {
  res.send({
    'FriendlyName': 'plexProxy',
    'Manufacturer': 'Silicondust',
    'ModelNumber': 'HDTC-2US',
    'FirmwareName': 'hdhomeruntc_atsc',
    'TunerCount': 1,
    'FirmwareVersion': '20150826',
    'DeviceID': '12345678',
    'DeviceAuth': 'test1234',
    'BaseURL': 'http://192.168.10.173:5004',
    'LineupURL': 'http://192.168.10.173:5004/lineup.json',
  })
})

app.get('/lineup_status.json', function (req, res) {
  res.send({
      'ScanInProgress': 0,
      'ScanPossible': 1,
      'Source': "Cable",
      'SourceList': ['Cable']
  })
})

app.get('/lineup.json', function (req, res) {
  request('https://tvplayer.com/watch', function (error, response, html) {
    var $ = cheerio.load(html)
    var items = []
    var i = 0

    $('#now-next-channels > #first-tab > a').each(function() {
      items.push({
        'GuideNumber': i.toString(),
        'GuideName': $(this).attr('title'),
        'URL': 'http://192.168.10.173:5004/stream/' + $(this).attr('href').replace('/watch/', '')
      })

      i++
    })

    res.send(items)
  })
})

app.get('/stream/:name', function (req, res) {
  var child = child_process.exec(`streamlink https://tvplayer.com/watch/${req.params.name} best --tvplayer-email email --tvplayer-password password --player-external-http  --player-external-http-port 8080`)

  var ready = false

  child.stdout.on('data', function(data) {
    console.log(data.toString())
    console.log(data.toString().includes('http:'))
      if (data.toString().includes('http:')) {
        ready = true
        res.redirect('http://192.168.10.173:8080')
      }
  })
})

app.get('/lineup.post', function (req, res) {
  res.send('')
})

app.post('/lineup.post', function (req, res) {
  res.send('')
})

app.listen(5004, '192.168.10.173', () => console.log('Listening on port 5004'))
