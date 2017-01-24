"use strict"

/**
 * Converts GeoJSON files to a format that map-canvas understands
 */

const fs = require('fs')
const path = require('path')


// Read in our arguments, first two args are node info
process.argv.slice(2).forEach((v, i) => convertGeoJSON(v))

function convertGeoJSON(filepath) {
  fs.readFile(filepath, 'utf-8', (err, data) => {
    console.log("Converting " + path.basename(filepath) + "...")
    var json = JSON.parse(data)
    var output_json = {
      shapes: []
    }
    for(let f in json.features) {
      let feature = json.features[f]
      let arr = []
      let coordinates = feature.geometry.coordinates[0]
      for(let c in coordinates) {
        let coordinate = coordinates[c]
        arr.push({
          "lon": coordinate[0],
          "lat": coordinate[1]
        })
      }
      output_json.shapes.push(arr)
    }
    fs.writeFile(path.dirname(filepath) + '/converted_' + path.basename(filepath), JSON.stringify(output_json), (err) => {
      if (err) throw err
      console.log(path.basename(filepath) + " Converted!")
    })
  })
}



