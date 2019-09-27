/*jslint esnext: true */


require.config({
    paths: {
        text: "daadisplays/daa-displays-min/lib/text/text"
    }
});

require(["daadisplays/daa-displays-min/daa-airspeed-tape",
    "daadisplays/daa-displays-min/daa-altitude-tape",
    "daadisplays/daa-displays-min/daa-vertical-speed-tape",
    "daadisplays/daa-displays-min/daa-compass",
    "daadisplays/daa-displays-min/daa-interactive-map",
    "daadisplays/daa-displays-min/daa-virtual-horizon",
    "daa_comms"

], function (AirspeedTape,
    AltitudeTape,
    VerticalSpeedTape,
    Compass,
    InteractiveMap,
    VirtualHorizon,
    Comms
) {
    "use strict";

    // example traffic data
    let ownship = {
        "id": "AC0",
        "s": {
            "lat": 28.496733,
            "lon": -80.530344,
            "alt": 0
        },
        "v": {
            "x": 292.619934,
            "y": 169.822964,
            "z": 40.558194
        }
    };

    let others = [{
            "id": "AC1",
            "s": {
                "lat": 28.547052,
                "lon": -80.715877,
                "alt": 4000.018859
            },
            "v": {
                "x": 107.350647,
                "y": 200.000092,
                "z": 0.004356
            }
        },
        {
            "id": "AC2",
            "s": {
                "lat": 28.520167,
                "lon": -80.61631,
                "alt": 3500.007042
            },
            "v": {
                "x": 299.373444,
                "y": 110.000044,
                "z": 0.001983
            }
        },
        {
            "id": "AC3",
            "s": {
                "lat": 28.5166,
                "lon": -80.70284,
                "alt": 6000.008612
            },
            "v": {
                "x": 76.524117,
                "y": 164.000187,
                "z": 0.00126
            }
        }
    ];

    const map = new InteractiveMap("map", {
        top: 2,
        left: 6
    }, {
        parent: "daa-disp1"
            // ,offlineMap: "../wwdData/WebWorldWind-StandaloneData/Earth/BlueMarble256/"
            ,
        terrain: "OpenStreetMap"
    });
    // map.setHeading(0); // this will be driven by compass
    map.setPosition(ownship.s);
    map.setTrafficPosition(others);

    const compass = new Compass("compass", {
        top: 110,
        left: 215
    }, {
        parent: "daa-disp1",
        map: map
    });
    compass.setCompass(0);
    compass.setBug(0);
    compass.setBands({
        RECOVERY: [{
            from: 0,
            to: 30
        }],
        NEAR: [{
            from: 30,
            to: 60
        }, {
            from: 330,
            to: 360
        }]
    });

    const airspeedTape = new AirspeedTape("airspeed", {
        top: 100,
        left: 100
    }, {
        parent: "daa-disp2"
    });
    airspeedTape.setAirSpeed(100);
    airspeedTape.setBands({
        RECOVERY: [{
            from: 0,
            to: 200
        }],
        NEAR: [{
            from: 200,
            to: 300
        }]
    });

    const altitudeTape = new AltitudeTape("altitude", {
        top: 100,
        left: 600
    }, {
        parent: "daa-disp2"
    });
    altitudeTape.setAltitude(4000);
    altitudeTape.setBands({
        RECOVERY: [{
            from: 3800,
            to: 4000
        }],
        NEAR: [{
            from: 4000,
            to: 4200
        }]
    });

    const verticalSpeedTape = new VerticalSpeedTape("vertical-speed", {
        top: 210,
        left: 600
    }, {
        parent: "daa-disp2"
    });
    verticalSpeedTape.setVerticalSpeed(1);
    verticalSpeedTape.setBands({
        RECOVERY: [{
            from: -1,
            to: 1.5
        }],
        NEAR: [{
            from: 1.5,
            to: 2
        }, {
            from: -2,
            to: -1
        }]
    });

    const virtualHorizon = new VirtualHorizon("virtual-horizon", {
        top: 2,
        left: 30
    }, {
        parent: "daa-disp2"
    });
    virtualHorizon.setPitch(2);
    virtualHorizon.setRoll(10);

    const comms = new Comms('comms', {
        ac: 1
    });

    const playground = new Playground({
        map: map,
        compass: compass,
        airspeed: airspeedTape,
        altitude: altitudeTape,
        vspeed: verticalSpeedTape,
        vhorizon: virtualHorizon,
        comms: comms
    });

});