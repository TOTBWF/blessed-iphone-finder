"use strict"

// Load in our libraries
var icloud = require('find-my-iphone').findmyphone
var prompt = require('prompt')
var blessed = require('blessed')
var contrib = require('blessed-contrib')
var innerMap = require('map-canvas')
const format = require('date-format')
const chalk = require('chalk')
var fs = require('fs')

const TIME_MS = 1
const TIME_SEC = TIME_MS * 1000
const TIME_MIN = TIME_SEC * 60
const TIME_HOUR = TIME_MIN * 60

var logname = "Iphone-" + new Date().getTime() + ".log"
var device;

// Set up our promt schema
var schema = {
  properties: {
    username: {
    },
    password: {
      hidden: true,
      replace: '*'
    }
  }
};

// Load a map of vancouver and add it to our mapping lib
innerMap.prototype.getMapData_vancouver = () => {
  return require('../vancouver.json')
}

class Dashboard {
  constructor() {
    this.markers = []
    this.widgets = {}

    this.screen = blessed.screen({
      title: "IPhone Dashboard",
      autopadding: true,
      dockBorders: true,
      fullUnicode: true,
      smartCSR: true
    })

    this.screen.key(["escape", "q", "C-c"], (ch, key) => process.exit(0))
    this.grid = new contrib.grid({
      screen: this.screen,
      rows: 12,
      cols: 12
    })
  
    // Shared Settings
    const shared = {
      border: {
        type: "line"
      },
      style: {
        fg: "blue",
        test: "blue",
        border: {
          fg: "green"
        }
      }
    }

    // Widgets for the dashboard
    const widgets = {
      map: {
        type: contrib.map,
        size: {
          width: 12,
          height: 9,
          top: 0,
          left: 0
        },
        options: Object.assign({}, shared, {
          label: "Map",
          startLon: 180 + -123.2247,
          endLon: 180 + -123.0233,
          startLat: 90 + 49.1997,
          endLat: 90 + 49.2953,
          region: 'vancouver'
        })
      },
      log: {
        type: contrib.log,
        size: {
          width: 12,
          height: 3,
          top: 9,
          left: 0
        },
        options: Object.assign({}, shared, {
          label: "Log",
          padding: {
            left: 1
          }
        })
      },
    }
    for(let name in widgets) {
      let widget = widgets[name]

      this.widgets[name] = this.grid.set(
        widget.size.top,
        widget.size.left,
        widget.size.height,
        widget.size.width,
        widget.type,
        widget.options
      )
    }
  }

  /**
   * Log data
   *
   * @param {String} message
   *
   * @return {Void}
   */
  log(message) {
    const time = format("MM/dd/yy-hh:mm:ss", new Date())
    this.widgets.log.log(`${time}: ${message}`);
  }

  /**
   * Draw a waypoint on the map
   *
   * @param {Obj} data
   *
   * @return {Void}
   */
  waypoint(data) {
    // Assign Defaults
    if(!data.color) {
      data.color = "yellow"
    }
    if(!data.color) {
      data.char = "*"
    }
    this.markers.push(data)

    // Check to see if the blink object is initialized
    if(this.blink) {
      return
    }

    var visible = true

    this.blink = setInterval(() => {
      if(visible) {
        this.markers.forEach((m) => this.widgets.map.addMarker(m))
      } else {
        this.widgets.map.clearMarkers()
      }

      visible = !visible

      this.render()
    }, 1*TIME_SEC)
  }


  /**
   * Renders the dashboard
   *
   * @return {Void}
   */
  render() {
    this.screen.render();
  }
}

// Setup our dashboard and initialize our prompt
const dashboard = new Dashboard()
prompt.start()

prompt.get(schema, (err, result) => {
  icloud.apple_id = result.username
  icloud.password = result.password

  icloud.getDevices((error, devices) => {

    if(error) {
      throw error
    }

    // Find our device
    devices.forEach((d) => {
      if (device == undefined && d.lostModeCapable) {
        device = d
      }
    })
    // Run our queryDevice function every minute
    setInterval(queryDevice, 60*1000)
    dashboard.render()
  })
})

/**
 * Queries the device and logs and displays the data
 *
 * @return {Void}
 */
function queryDevice() {
  icloud.getLocationOfDevice(device, function(err, location) {
    if(location) {
      dashboard.log("Lat:" + location.latitude + " Lon:" + location.longitude)
      dashboard.waypoint({lat: location.latitude, lon:location.longitude})
      fs.appendFile(logname, location + '\n', function(err) { console.log(err)})
    } else {
      dashboard.log("No Connection to Device...")
    }
  })
}
