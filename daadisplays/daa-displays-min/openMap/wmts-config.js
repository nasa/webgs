const wmtsConfig = {
    "identifier": "osm",
    "format": "image/jpg",
    "resourceUrl": "http://localhost:8082/tiles.maps.eox.at/wmts/1.0.0/osm/default/WGS84/{TileMatrix}/{TileRow}/{TileCol}.jpg",
    "style": "default",
    "tileMatrixSet": {
     "identifier": "WGS84",
     "boundingBox": {
      "crs": "urn:ogc:def:crs:EPSG:6.3:4326",
      "lowerCorner": [
       -90,
       -180
      ],
      "upperCorner": [
       90,
       180
      ]
     },
     "supportedCRS": "urn:ogc:def:crs:EPSG:6.3:4326",
     "wellKnownScaleSet": "urn:ogc:def:wkss:OGC:1.0:GoogleCRS84Quad",
     "tileMatrix": [
      {
       "identifier": "0",
       "scaleDenominator": 279541132.0143589,
       "topLeftCorner": [
        90,
        -180
       ],
       "tileWidth": 256,
       "tileHeight": 256,
       "matrixWidth": 2,
       "matrixHeight": 1,
       "levelNumber": 0
      },
      {
       "identifier": "1",
       "scaleDenominator": 139770566.00717944,
       "topLeftCorner": [
        90,
        -180
       ],
       "tileWidth": 256,
       "tileHeight": 256,
       "matrixWidth": 4,
       "matrixHeight": 2,
       "levelNumber": 1
      },
      {
       "identifier": "2",
       "scaleDenominator": 69885283.00358972,
       "topLeftCorner": [
        90,
        -180
       ],
       "tileWidth": 256,
       "tileHeight": 256,
       "matrixWidth": 8,
       "matrixHeight": 4,
       "levelNumber": 2
      },
      {
       "identifier": "3",
       "scaleDenominator": 34942641.50179486,
       "topLeftCorner": [
        90,
        -180
       ],
       "tileWidth": 256,
       "tileHeight": 256,
       "matrixWidth": 16,
       "matrixHeight": 8,
       "levelNumber": 3
      },
      {
       "identifier": "4",
       "scaleDenominator": 17471320.75089743,
       "topLeftCorner": [
        90,
        -180
       ],
       "tileWidth": 256,
       "tileHeight": 256,
       "matrixWidth": 32,
       "matrixHeight": 16,
       "levelNumber": 4
      },
      {
       "identifier": "5",
       "scaleDenominator": 8735660.375448715,
       "topLeftCorner": [
        90,
        -180
       ],
       "tileWidth": 256,
       "tileHeight": 256,
       "matrixWidth": 64,
       "matrixHeight": 32,
       "levelNumber": 5
      },
      {
       "identifier": "6",
       "scaleDenominator": 4367830.1877243575,
       "topLeftCorner": [
        90,
        -180
       ],
       "tileWidth": 256,
       "tileHeight": 256,
       "matrixWidth": 128,
       "matrixHeight": 64,
       "levelNumber": 6
      },
      {
       "identifier": "7",
       "scaleDenominator": 2183915.0938621787,
       "topLeftCorner": [
        90,
        -180
       ],
       "tileWidth": 256,
       "tileHeight": 256,
       "matrixWidth": 256,
       "matrixHeight": 128,
       "levelNumber": 7
      },
      {
       "identifier": "8",
       "scaleDenominator": 1091957.5469310894,
       "topLeftCorner": [
        90,
        -180
       ],
       "tileWidth": 256,
       "tileHeight": 256,
       "matrixWidth": 512,
       "matrixHeight": 256,
       "levelNumber": 8
      },
      {
       "identifier": "9",
       "scaleDenominator": 545978.7734655447,
       "topLeftCorner": [
        90,
        -180
       ],
       "tileWidth": 256,
       "tileHeight": 256,
       "matrixWidth": 1024,
       "matrixHeight": 512,
       "levelNumber": 9
      },
      {
       "identifier": "10",
       "scaleDenominator": 272989.38673277234,
       "topLeftCorner": [
        90,
        -180
       ],
       "tileWidth": 256,
       "tileHeight": 256,
       "matrixWidth": 2048,
       "matrixHeight": 1024,
       "levelNumber": 10
      },
      {
       "identifier": "11",
       "scaleDenominator": 136494.69336638617,
       "topLeftCorner": [
        90,
        -180
       ],
       "tileWidth": 256,
       "tileHeight": 256,
       "matrixWidth": 4096,
       "matrixHeight": 2048,
       "levelNumber": 11
      },
      {
       "identifier": "12",
       "scaleDenominator": 68247.34668319309,
       "topLeftCorner": [
        90,
        -180
       ],
       "tileWidth": 256,
       "tileHeight": 256,
       "matrixWidth": 8192,
       "matrixHeight": 4096,
       "levelNumber": 12
      },
      {
       "identifier": "13",
       "scaleDenominator": 34123.67334159654,
       "topLeftCorner": [
        90,
        -180
       ],
       "tileWidth": 256,
       "tileHeight": 256,
       "matrixWidth": 16384,
       "matrixHeight": 8192,
       "levelNumber": 13
      },
      {
       "identifier": "14",
       "scaleDenominator": 17061.836670798253,
       "topLeftCorner": [
        90,
        -180
       ],
       "tileWidth": 256,
       "tileHeight": 256,
       "matrixWidth": 32768,
       "matrixHeight": 16384,
       "levelNumber": 14
      },
      {
       "identifier": "15",
       "scaleDenominator": 8530.918335399127,
       "topLeftCorner": [
        90,
        -180
       ],
       "tileWidth": 256,
       "tileHeight": 256,
       "matrixWidth": 65536,
       "matrixHeight": 32768,
       "levelNumber": 15
      },
      {
       "identifier": "16",
       "scaleDenominator": 4265.459167699563,
       "topLeftCorner": [
        90,
        -180
       ],
       "tileWidth": 256,
       "tileHeight": 256,
       "matrixWidth": 131072,
       "matrixHeight": 65536,
       "levelNumber": 16
      },
      {
       "identifier": "17",
       "scaleDenominator": 2132.7295838497857,
       "topLeftCorner": [
        90,
        -180
       ],
       "tileWidth": 256,
       "tileHeight": 256,
       "matrixWidth": 262144,
       "matrixHeight": 131072,
       "levelNumber": 17
      }
     ]
    },
    "wgs84BoundingBox": {
        maxLatitude: -75.918,
        minLatitude: -76.663,
        maxLongitude: 37.208,
        minLongitude: 36.718,
        getSector: function () {
            return {
                "lowerCorner": [
                    -180,
                    -90
                ],
                "upperCorner": [
                    180,
                    90
                ]
            }
        },
        deltaLatitude: function () {
            return this.maxLatitude - this.minLatitude
        }
    },
    "title": "OpenStreetMap background layer by EOX - 4326"
   };