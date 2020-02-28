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
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    } else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    class Traffic {
        constructor(t_id, lat, lng, vel, hdg, alt, callsign, time) {

            if (callsign.length < 1) {
                callsign = t_id
            }
            this.id = t_id;
            this.lat = lat;
            this.lon = lng;
            this.alt = alt;
            this.vel = vel;
            this.hdg = hdg;
            this.callsign = callsign
            this.lastUpdate = time;
            this.descriptor = {
                s: {
                    lat: parseFloat(lat) / 10000000,
                    lon: parseFloat(lng) / 10000000,
                    alt: parseFloat(alt) / 1000
                },
                v: {
                    x: parseFloat(this.vel) / 100,
                    y: parseFloat(this.vel) / 100,
                    z: 0
                },
                symbol: "daa-traffic-monitor",
                callSign: callsign
            }
        }
    }

    exports.Traffic = Traffic
})