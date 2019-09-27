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


define(function (require, exports, module) {
    "use strict";
    require("daadisplays/daa-displays-min/daa-utils");
    require("daadisplays/daa-displays-min/templates/daa-airspeed-templates.js");

    let aircraft_list = []

    class Comms {
        constructor() {
            this.connection = createConnection()
        }

        getAircraftById(id) {
            let ac = 'Aircraft Not Found'
            for (let item of aircraft_list) {
                if (item.id == id) {
                    ac = item;
                }
            }
            return ac
        }

        getActiveAC() {
            for (let ac of aircraft_list) {
                if (ac.active) {
                    return ac
                }
            }
            return 'Aircraft Not Found'
        }
    }


    function createConnection() {

        // Connection Setup
        let host = location.host.toString()
        let ip = host.slice(0, -5)
        let port = 8000

        window.connection = new WebSocket('ws://' + ip + ':' + port);

        connection.onopen = function (event) {
            console.log('Connection Established: ws://' + ip + ':' + port)
            connection.send('Connection Established');
            setInterval(periodicEvents, 1000);
            addAircraftSelector()
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
            let ac = getAircraftById(id)

            // if it is a new ac wait for heartbeat before creating new ac
            if (ac != 'Aircraft Not Found') {
                // do nothing
                let x = 1
            } else if (ac == 'Aircraft Not Found' && m.TYPE == 'HEARTBEAT') {
                let mode = m.type
                ac = createAircraft(id)
                updateAircraftSelector()
            } else {
                return
            }

            if (m.name == 'SHUT_DOWN') {
                let ac = getAircraftById(m.AIRCRAFT)
                if (ac != 'Aircraft Not Found') {
                    // remove ac from the list
                    aircraft_list = aircraft_list.filter(el => el.id != ac.id)
                    console.log(aircraft_list)
                    // automatically make some other ac active
                    if (aircraft_list.length > 0) {
                        aircraft_list[0].active = true
                    }
                    // remove option from selector
                    updateAircraftSelector()
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
                updateTraffic(m)


            } else if (m.TYPE == 'ICAROUS_KINEMATIC_BANDS') {
                let num_bands = m.numBands
                let bands = {
                    FAR: [],
                    MID: [],
                    NEAR: [],
                    RECOVERY: [],
                    UNKNOWN: [],
                    NONE: []
                }

                // find the danger area or areas
                for (let i = 1; i <= num_bands; i++) {
                    if (m['type' + i] === 3) {
                        bands['NEAR'].push({
                            from: m['min' + i],
                            to: m['max' + i]
                        })

                    } else if (m['type' + i] === 1) {
                        bands['NONE'].push({
                            from: m['min' + i],
                            to: m['max' + i]
                        })
                    }
                }
                ac.bands = bands
                ac.band_last = Date.now()

            }
        }
    }

    function createAircraft(id) {
        let fp = [];
        let ac = new Aircraft(id, aircraft_list, fp);
        aircraft_list.push(ac);
        if (aircraft_list.length == 1) {
            ac.active = true
        }

        return ac
    }


    class Aircraft {
        constructor(ac_id, aircraft_list, fp) {
            this.id = ac_id;
            this.aircraft_list = aircraft_list;

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
            this.bands = [];
            this.band_last = 0;
            this.traffic_list = [];
            this.rerender = false;
            this.active = false
        }

    }

    function getAircraftById(id) {
        let ac = 'Aircraft Not Found'
        for (let item of aircraft_list) {
            if (item.id == id) {
                ac = item;
            }
        }
        return ac
    }



    class Traffic {
        constructor(t_id, lat, lng, vel, hdg, alt, time) {
            this.id = t_id;
            this.lat = lat;
            this.lon = lng;
            this.alt = alt;
            this.vel = vel;
            this.hdg = hdg;
            this.lastUpdate = time;
            this.descriptor = {
                s: {
                    lat: parseFloat(lat),
                    lon: parseFloat(lng),
                    alt: parseFloat(alt)
                },
                symbol: "daa-alert",
                name: t_id
            }
        }
    }

    function updateTraffic(m) {
        let ac = getAircraftById(m['AIRCRAFT'])

        // check ac list for this traffic item
        for (let item of ac.traffic_list) {
            if (item.id == m['callsign']) {
                item.lat = m['lat']
                item.lon = m['lon']
                item.vel = m['hor_velocity']
                item.hdg = m['heading']
                item.alt = m['altitude']
                item.lastUpdate = Date.now()
                item.descriptor = {
                    s: {
                        lat: m['lat'],
                        lon: m['lon'],
                        alt: m['altitude']
                    },
                    symbol: "daa-alert",
                    name: m['callsign']
                }
                return
            }
        }

        // if that failed make a new traffic object
        let t = new Traffic(m['callsign'], m['lat'], m['lon'], m['hor_velocity'], m['heading'], m['altitude'], Date.now())
        ac.traffic_list.push(t)
        return
    }


    function periodicEvents() {
        for (let ac of aircraft_list) {
            ac.rerender = false
            // remove bands if they are there too long without an update
            if (Date.now() - ac.band_last > 1000) {
                ac.bands = {
                    FAR: [],
                    MID: [],
                    NEAR: [],
                    RECOVERY: [],
                    UNKNOWN: [],
                    NONE: []
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

    function addAircraftSelector() {
        let sel = document.getElementById('aircraft_selector')
        let ac_sel = document.createElement('select')
        ac_sel.setAttribute('id', 'ac_select')
        ac_sel.setAttribute('autofocus', 'true');
        ac_sel.setAttribute('style', "margin-left:1150px; margin-top:20px; width:150px")
        let opt
        for (let ac of aircraft_list) {
            opt = document.createElement('option');
            opt.setAttribute('value', 'Aircraft' + ac.id);

            opt.innerHTML = 'Aircraft' + ac.id
            ac_sel.appendChild(opt)
        }
        sel.appendChild(ac_sel)

        ac_sel.addEventListener('change', function (e) {
            let ac_id = parseFloat(e.target.value.split(' ')[1])
            let ac = getAircraftById(ac_id)
            for (let a of aircraft_list) {
                a.active = false
            }
            ac.active = true
        })
    }

    function updateAircraftSelector() {
        let ac_sel = document.getElementById('ac_select')

        while (ac_sel.hasChildNodes()) {
            console.log(ac_sel.hasChildNodes())
            ac_sel.lastChild.parentNode.removeChild(ac_sel.lastChild)
        }

        let opt
        for (let ac of aircraft_list) {
            opt = document.createElement('option');
            opt.setAttribute('value', 'Aircraft ' + ac.id);
            opt.innerHTML = 'Aircraft ' + ac.id
            ac_sel.appendChild(opt)
            console.log('added', opt)
        }
    }

    module.exports = Comms
})