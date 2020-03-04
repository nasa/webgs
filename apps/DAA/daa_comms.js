/**
 *
 * @module comms
 * @version 1.0.0
 * @description <b> Communication Module for DAA Display</b>
 *
 *
 * @example none
 * @author Andrew Peters
 * @date May 2019
 * @copyright
 * Notices:
 * Copyright 2019 United States Government as represented by the Administrator of the National Aeronautics
 * and Space Administration. All Rights Reserved.
 *  
 * Disclaimers
 * No Warranty: THE SUBJECT SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF ANY
 * KIND, EITHER EXPRESSED, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, ANY
 * WARRANTY THAT THE SUBJECT SOFTWARE WILL CONFORM TO SPECIFICATIONS, ANY IMPLIED
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR FREEDOM FROM
 * INFRINGEMENT, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL BE ERROR FREE, OR ANY
 * WARRANTY THAT DOCUMENTATION, IF PROVIDED, WILL CONFORM TO THE SUBJECT SOFTWARE.
 * THIS AGREEMENT DOES NOT, IN ANY MANNER, CONSTITUTE AN ENDORSEMENT BY GOVERNMENT
 * AGENCY OR ANY PRIOR RECIPIENT OF ANY RESULTS, RESULTING DESIGNS, HARDWARE,
 * SOFTWARE PRODUCTS OR ANY OTHER APPLICATIONS RESULTING FROM USE OF THE SUBJECT
 * SOFTWARE.  FURTHER, GOVERNMENT AGENCY DISCLAIMS ALL WARRANTIES AND LIABILITIES
 * REGARDING THIRD-PARTY SOFTWARE, IF PRESENT IN THE ORIGINAL SOFTWARE, AND
 * DISTRIBUTES IT "AS IS."
 *  
 * Waiver and Indemnity:  RECIPIENT AGREES TO WAIVE ANY AND ALL CLAIMS AGAINST THE UNITED
 * STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR
 * RECIPIENT.  IF RECIPIENT'S USE OF THE SUBJECT SOFTWARE RESULTS IN ANY LIABILITIES,
 * DEMANDS, DAMAGES, EXPENSES OR LOSSES ARISING FROM SUCH USE, INCLUDING ANY
 * DAMAGES FROM PRODUCTS BASED ON, OR RESULTING FROM, RECIPIENT'S USE OF THE SUBJECT
 * SOFTWARE, RECIPIENT SHALL INDEMNIFY AND HOLD HARMLESS THE UNITED STATES
 * GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR RECIPIENT,
 * TO THE EXTENT PERMITTED BY LAW.  RECIPIENT'S SOLE REMEDY FOR ANY SUCH MATTER SHALL
 * BE THE IMMEDIATE, UNILATERAL TERMINATION OF THIS AGREEMENT.
 *
 */
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
        define(["require", "exports", "./aircraft", "./traffic"], factory);
    }
})(function (require, exports) {
    "use strict";
    // require("daadisplays/daa-displays-min/daa-utils");
    // require("daadisplays/daa-displays-min/templates/daa-airspeed-templates.js");
    const A = require('./aircraft')
    const T = require('./traffic')


    class Comms {
        constructor() {
            this.connection = []
            this.aircraft_list = []
        }

        createConnection(C) {

            // Connection Setup
            let host = location.host.toString()
            let ip = host.slice(0, -5)
            let port = 8083

            let protocol = location.protocol
            if (protocol == 'https:') {
                window.connection = new WebSocket('wss://' + ip + ':' + port);
            } else if (protocol == 'http:') {
                window.connection = new WebSocket('ws://' + ip + ':' + port)
            }

            connection.onopen = function (event, ) {
                console.log('Connection Established: ws://' + ip + ':' + port)
                connection.send('Connection Established');
                setInterval(function () {
                    C.periodicEvents(C)
                }, 1000);
                console.log(C)
                C.addAircraftSelector(C)
            };

            connection.onclose = function (event) {
                console.log('Closing Connection: ws://' + ip + ':' + port)
            }

            // receiving data from socket server
            connection.onmessage = function (event) {
                let m
                try {
                    m = JSON.parse(event.data)
                } catch (e) {
                    console.log(event.data)
                    console.log(e)
                    return
                }

                if (m.info == ('CONNECTION_FAILED')) {
                    alert('Connection Failed')
                    console.log(m)
                    return
                }

                // check that the ac exists if not create it
                let id = parseInt(m.AIRCRAFT);
                let ac = C.getAircraftById(C, id)
                // if it is a new ac wait for heartbeat before creating new ac
                if (ac != 'Aircraft Not Found') {
                    // do nothing
                    let x = 1
                } else if (ac == 'Aircraft Not Found' && m.TYPE == 'HEARTBEAT') {
                    let mode = m.type
                    ac = C.createAircraft(C, id)
                    C.updateAircraftSelector(C)
                } else {
                    return
                }

                if (m.name == 'SHUT_DOWN') {
                    let ac = C.getAircraftById(C, m.AIRCRAFT)
                    if (ac != 'Aircraft Not Found') {
                        // remove ac from the list
                        C.aircraft_list = C.aircraft_list.filter(el => el.id != ac.id)
                        console.log(C.aircraft_list)
                        // automatically make some other ac active
                        if (C.aircraft_list.length > 0) {
                            C.aircraft_list[0].active = true
                        }
                        // remove option from selector
                        C.updateAircraftSelector(C)
                    }
                    return
                }

                // sort through message types and take appropriate action
                if (m.TYPE == 'GLOBAL_POSITION_INT') {
                    ac.hasComms = true;
                    ac.commsLast = Date.now() / 1000
                    // update ac info
                    ac.lat = m.lat / 10000000;
                    ac.lng = m.lon / 10000000;
                    ac.alt = m.relative_alt / 1000;
                    ac.rel_alt = m.relative_alt / 1000;
                    ac.vx = m.vx / 100;
                    ac.vy = m.vy / 100;
                    ac.vz = m.vz / 100;
                    ac.hdg = m.hdg / 100;
                    ac.gps_status = true


                } else if (m.TYPE == 'ATTITUDE') {

                    let degrees = function (rad) {
                        return rad * 180 / Math.PI;
                    }

                    ac.roll = degrees(m.roll)
                    ac.pitch = degrees(m.pitch)
                    ac.yaw = degrees(m.yaw)
                    ac.rollSpeed = degrees(m.rollspeed)
                    ac.pitchSpeed = degrees(m.pitchspeed)
                    ac.yawSpeed = degrees(m.yawspeed)


                } else if (m.TYPE == 'TRAFFIC') {
                    C.updateTraffic(C, m)


                } else if (m.TYPE == 'ICAROUS_KINEMATIC_BANDS') {
                    let set
                    let type = Math.floor(m['type1'] / 7) // 0-normal, 1-hspeed, 2-alt, 3-vspeed

                    ac.ic_bands[type].num_bands = m.numBands
                    let band = 0
                    let b = {
                        'FAR': [],
                        'MID': [],
                        'NEAR': [],
                        'RECOVERY': [],
                        'UNKNOWN': [],
                        'NONE': []
                    }

                    let num = 5
                    set = ac.ic_bands[type].set_recieved

                    if (m.numBands <= 5) {
                        num = m.numBands
                        set = true
                    }

                    if (set) {
                        ac.ic_bands[type].bands = b // clears the bands
                        ac.ic_bands[type].set_recieved = false
                    }

                    // find the danger area or areas
                    for (let i = 1; i <= num; i++) {

                        band = m['type' + i] % 7
                        if (band === 5) {
                            ac.ic_bands[type].bands['FAR'].push({
                                from: m['min' + i],
                                to: m['max' + i]
                            })
                        } else if (band === 4) {
                            ac.ic_bands[type].bands['MID'].push({
                                from: m['min' + i],
                                to: m['max' + i]
                            })
                        } else if (band === 3) {
                            ac.ic_bands[type].bands['NEAR'].push({
                                from: m['min' + i],
                                to: m['max' + i]
                            })
                        } else if (band === 2) {
                            ac.ic_bands[type].bands['RECOVERY'].push({
                                from: m['min' + i],
                                to: m['max' + i]
                            })
                        } else if (band === 1) {
                            ac.ic_bands[type].bands['NONE'].push({
                                from: m['min' + i],
                                to: m['max' + i]
                            })
                        } else if (band === 0) {
                            ac.ic_bands[type].bands['UNKNOWN'].push({
                                from: m['min' + i],
                                to: m['max' + i]
                            })
                        } else {
                            ac.ic_bands[type].set_recieved = true
                            break
                        }
                    }
                    ac.band_last = Date.now()
                }
            }
        }

        getAircraftById(C, id) {
            let ac = 'Aircraft Not Found'
            for (let item of C.aircraft_list) {
                if (item.id == id) {
                    ac = item;
                }
            }
            return ac
        }

        getActiveAC(C) {
            for (let ac of C.aircraft_list) {
                if (ac.active) {
                    return ac
                }
            }
            return 'Aircraft Not Found'
        }

        createAircraft(C, id) {
            let ac = new A.Aircraft(id);
            C.aircraft_list.push(ac);
            if (C.aircraft_list.length == 1) {
                ac.active = true
            }
            return ac
        }

        updateTraffic(C, m) {
            // console.log(m)
            let ac = C.getAircraftById(C, m['AIRCRAFT'])

            // check ac list for this traffic item
            for (let item of ac.traffic_list) {
                if (item.id == m['ICAO_address'].toString()) {
                    item.lat = m['lat']
                    item.lon = m['lon']
                    item.vel = m['hor_velocity']
                    item.hdg = m['heading']
                    item.alt = m['altitude']
                    item.lastUpdate = Date.now()
                    item.convert_vel()
                    item.descriptor = {
                        s: {
                            lat: parseFloat(item.lat) / 10000000,
                            lon: parseFloat(item.lon) / 10000000,
                            alt: parseFloat(item.alt) / 1000
                        },
                        v: {
                            x: item.x,
                            y: item.y,
                            z: 0.0
                        },
                        symbol: "daa-traffic-monitor",
                        callSign: item.id
                    }
                    return
                }
            }

            // if that failed make a new traffic object
            let t = new T.Traffic(m['ICAO_address'].toString(), m['lat'], m['lon'], m['hor_velocity'], m['heading'], m['altitude'], m['callsign'], Date.now())
            ac.traffic_list.push(t)
            return
        }


        addAircraftSelector(C) {
            let sel = document.getElementById('daa-disp-left')
            let ac_sel = document.createElement('select')
            ac_sel.setAttribute('id', 'ac_select')
            ac_sel.setAttribute('autofocus', 'true');
            ac_sel.setAttribute('style', "margin-left:1075px; margin-top:10px; width:125px")
            let opt
            for (let ac of C.aircraft_list) {
                opt = document.createElement('option');
                opt.setAttribute('value', 'Aircraft' + ac.id);

                opt.innerHTML = 'Aircraft' + ac.id
                ac_sel.appendChild(opt)
            }
            sel.appendChild(ac_sel)

            ac_sel.addEventListener('change', function (e) {
                let ac_id = parseFloat(e.target.value.split(' ')[1])
                let ac = C.getAircraftById(ac_id)
                for (let a of C.aircraft_list) {
                    a.active = false
                }
                ac.active = true
            })
        }

        updateAircraftSelector(C) {
            let ac_sel = document.getElementById('ac_select')

            while (ac_sel.hasChildNodes()) {
                console.log(ac_sel.hasChildNodes())
                ac_sel.lastChild.parentNode.removeChild(ac_sel.lastChild)
            }

            let opt
            for (let ac of C.aircraft_list) {
                opt = document.createElement('option');
                opt.setAttribute('value', 'Aircraft ' + ac.id);
                opt.innerHTML = 'Aircraft ' + ac.id
                ac_sel.appendChild(opt)
                console.log('added', opt)
            }
        }

        periodicEvents(C) {
            for (let ac of C.aircraft_list) {
                ac.rerender = false
                // remove bands if they are there too long without an update
                if (Date.now() - ac.band_last > 1000) {
                    ac.ic_bands = {
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
                }
                ac.traffic_list = ac.traffic_list.filter((el) => {
                    // remove un-updated traffic
                    if (Date.now() - el.lastUpdate < 2000) {
                        return el
                    } else {
                        ac.rerender = true
                    }
                })
            }

        }
    }


    exports.Comms = Comms
})