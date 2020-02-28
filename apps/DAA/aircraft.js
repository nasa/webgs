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

    class Aircraft {
        constructor(ac_id) {
            this.id = ac_id;

            this.lat = 0;
            this.lng = 0;
            this.alt = 5.0;
            this.rel_alt = 0;
            this.vx = 0;
            this.vy = 0;
            this.vz = 0;
            this.hdg = 0;
            this.roll = 0;
            this.pitch = 0;
            this.yaw = 0;
            this.rollSpeed = 0;
            this.pitchSpeed = 0;
            this.yawSpeed = 0;
            this.ic_bands = {
                0: {
                    'bands': {
                        'FAR': [],
                        'MID': [],
                        'NEAR': [],
                        'RECOVERY': [],
                        'UNKNOWN': [],
                        'NONE': []
                    },
                    'set_recieved': false,
                    'num_bands': 0
                },
                1: {
                    'bands': {
                        'FAR': [],
                        'MID': [],
                        'NEAR': [],
                        'RECOVERY': [],
                        'UNKNOWN': [],
                        'NONE': []
                    },
                    'set_recieved': false,
                    'num_bands': 0
                },
                2: {
                    'bands': {
                        'FAR': [],
                        'MID': [],
                        'NEAR': [],
                        'RECOVERY': [],
                        'UNKNOWN': [],
                        'NONE': []
                    },
                    'set_recieved': false,
                    'num_bands': 0
                },
                3: {
                    'bands': {
                        'FAR': [],
                        'MID': [],
                        'NEAR': [],
                        'RECOVERY': [],
                        'UNKNOWN': [],
                        'NONE': []
                    },
                    'set_recieved': false,
                    'num_bands': 0
                }
            }
            this.band_last = 0;
            this.traffic_list = [];
            this.rerender = false;
            this.active = false
        }


    }

    exports.Aircraft = Aircraft
})