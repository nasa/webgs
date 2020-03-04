var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function (resolve) {
            resolve(value);
        });
    }
    return new(P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }

        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }

        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


(function (factory) {
    require.config({
        baseUrl: "./daa-displays/dist",
        paths: {
            widgets: "./daa-displays/dist",
            text: ".daa-displays/lib/text/text"
        }
    });
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    } else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../../daa_comms", "./daa-displays/daa-airspeed-tape", "./daa-displays/daa-altitude-tape", "./daa-displays/daa-vertical-speed-tape", "./daa-displays/daa-compass", "./daa-displays/daa-hscale", "./daa-displays/daa-interactive-map", "./daa-displays/daa-player", "./daa-displays/daa-view-options"], factory);
    }
})(function (require, exports) {
    "use strict";
    exports.baseUrl = "daa-displays/dist/daa-displays/";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    const daa_airspeed_tape_1 = require("./daa-displays/daa-airspeed-tape");
    const daa_altitude_tape_1 = require("./daa-displays/daa-altitude-tape");
    const daa_vertical_speed_tape_1 = require("./daa-displays/daa-vertical-speed-tape");
    const daa_compass_1 = require("./daa-displays/daa-compass");
    const daa_hscale_1 = require("./daa-displays/daa-hscale");
    const daa_interactive_map_1 = require("./daa-displays/daa-interactive-map");
    const daa_view_options_1 = require("./daa-displays/daa-view-options");
    const daa_comms = require("../../daa_comms");


    // single player
    const map = new daa_interactive_map_1.InteractiveMap("map", {
        top: 2,
        left: 6
    }, {
        parent: "daa-disp"
    });

    // map heading is controlled by the compass
    const compass = new daa_compass_1.Compass("compass", {
        top: 110,
        left: 215
    }, {
        parent: "daa-disp",
        map: map
    });
    // map zoom is controlled by nmiSelector
    const hscale = new daa_hscale_1.HScale("hscale", {
        top: 800,
        left: 13
    }, {
        parent: "daa-disp",
        map: map
    });
    // map view options
    const viewOptions = new daa_view_options_1.ViewOptions("view-options", {
        top: 4,
        left: 13
    }, {
        parent: "daa-disp",
        compass,
        map
    });
    // create remaining display widgets
    const airspeedTape = new daa_airspeed_tape_1.AirspeedTape("airspeed", {
        top: 100,
        left: 100
    }, {
        parent: "daa-disp"
    });
    const altitudeTape = new daa_altitude_tape_1.AltitudeTape("altitude", {
        top: 100,
        left: 825
    }, {
        parent: "daa-disp"
    });
    const verticalSpeedTape = new daa_vertical_speed_tape_1.VerticalSpeedTape("vertical-speed", {
        top: 210,
        left: 980
    }, {
        parent: "daa-disp",
        verticalSpeedRange: 2000
    });


    let comms = new daa_comms.Comms()
    comms.createConnection(comms)
    console.log(comms)

    setInterval(function () {
        let ac = comms.getActiveAC(comms)

        // update map
        if (ac.lat && ac.lng) {
            map.setPosition({
                lat: ac.lat,
                lon: ac.lng,
                alt: ac.rel_alt
            })

            map.setOwnshipVelocity({
                x: ac.vx,
                y: ac.vy,
                z: ac.vz
            })

        }

        // update traffic
        if (ac.traffic_list) {
            let t_list = []
            for (let t of ac.traffic_list) {
                // console.log(t.descriptor)
                t_list.push(t.descriptor)
            }
            map.setTrafficPosition(t_list)
        }

        // update compass
        if (ac.hdg) {
            compass.setCompass(ac.hdg)
        }
        if (ac.vy && ac.vx) {
            compass.setBug(((Math.atan2(ac.vy, ac.vx)) * 180 / Math.PI))
        }
        if (ac.bands) {
            compass.setBands(ac.bands)
        }

        // update alt tape
        if (ac.rel_alt) {
            altitudeTape.setAltitude(ac.rel_alt, 'meters')
        }

        // update air speed tape
        if (ac.vy && ac.vx) {
            airspeedTape.setAirSpeed(Math.hypot(ac.vx, ac.vy), 'msec')
        }

        // update vert speed tape
        if (ac.vz) {
            verticalSpeedTape.setVerticalSpeed(ac.vz, 'msec');
        }

        // update bands
        if (ac.ic_bands) {
            for (let [type, band] of Object.entries(ac.ic_bands)) {
                // console.log(type, band)
                if (type == '0') {
                    // normal
                    if (type) {
                        compass.setBands(band.bands)
                    }
                } else if (type == '1') {
                    // horizontal speed
                    if (type) {
                        airspeedTape.setBands(band.bands)
                    }
                } else if (type == '2') {
                    // altitude
                    if (type) {
                        altitudeTape.setBands(band.bands)
                    }
                } else if (type == '3') {
                    // vertical speed
                    if (type) {
                        verticalSpeedTape.setBands(band.bands)
                    }
                }
            }
        }

    }, 200)

});