/**
 *
 * @module comms
 * @version 1.0.1
 * @description <b> Communications Module </b>
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


import {
    AM,
    MODE
} from './entry.js'

import * as F from '../views/form.js'
import * as M from '../views/map.js'

import * as W from '../models/waypoint.js'

import * as E from '../control/eventFunctions.js'
import * as P from '../control/playback.js'

import * as T from '../Traffic/traffic.js'
import * as TE from '../Traffic/eventFunctionsTraffic.js'
import * as GE from '../Geofence/geofenceEvents.js'
import * as I from '../Indicators/indicators.js'

let comms_timeout = 10

/**
 * @function <a name="createConnection">createConnection</a>
 * @description Create a websocket connection.
 * @param ip {string} Ip Address.
 * @param port {string} Port number.
 * @listens connection.onopen
 * @listens connection.onclose
 * @listens connection.onmessage
 * @memberof module:comms
 */
export function createConnection(ip, port) {
    // Connection Setup
    if (MODE.protocol == 'https:') {
        window.connection = new WebSocket('wss://' + ip + ':' + port);
    } else if (MODE.protocol == 'http:') {
        window.connection = new WebSocket('ws://' + ip + ':' + port)
    }
    connection.onopen = function (event) {
        // check local user settings
        E.checkLocalStorage()

        console.log('Connection Established: ws://' + ip + ':' + port)
        F.alertBannerGreen('Connection Established: ws://' + ip + ':' + port)

        MODE.con_status = 'Connection Status: Connected'

        F.updateSettingsPanel()

        connection.send('Connection Established');

        setInterval(periodicEvents_5, 5000) // checks connection
        setInterval(periodicEvents_3, 3000) // cleans up traffic
        setInterval(periodicEvents_1, 1000) // sends adsb to all aircraft
        window.addEventListener('unload', function () {
            window.connection.close(1000, 'Closing or Refreshing')
        })
    };

    connection.onclose = function (event) {
        console.log('Closing Connection: ws://' + ip + ':' + port)
        if (event.code == 1006) {

            MODE.con_status = 'Connection Status: Disconnected'
            F.updateSettingsPanel()

            F.alertBannerRed('Unable to connect. Please check the IP address and port, and then try again.')
        } else {
            MODE.con_status = 'Connection Status: Disconnected'
            F.updateSettingsPanel()
            F.alertBannerRed('Unable to connect. Please check the IP address and port, and then try again.', event.code)
        }
    }

    let m
    // receiving data from server
    connection.onmessage = function (event) {
        m = ''
        try {
            // console.log(event.data)
            m = JSON.parse(event.data)
        } catch (e) {
            console.log(event.data)
            console.log(e)
            return
        }

        if (m.name == 'HITL') {
            if (m.INFO == 'CONNECTION_FAILED') {
                F.alertBannerRed('Connection Failed. Please check the settings, and try again.')
            }
            console.log(m)
            return

        } else if (m.TYPE == 'CONNECTING') {
            F.alertBannerRed('Waiting for Heartbeat from ac ' + m.AIRCRAFT)
            return

        } else if (m.name == 'SHUT_DOWN') {
            // handles multi-user ac shutdown
            // check for ac in list
            let ac = AM.getAircraftById(m.AIRCRAFT)
            if (ac != 'Aircraft Not Found') {
                // shutdown ac
                E.acShutdown(ac, false)
            } else if (m.AIRCRAFT == 'PLAYBACK') {
                for (let ac of AM.aircraft_list) {
                    E.acShutdown(ac, false)
                }
            }
            return

        } else if (m.name == 'IC_PLAYBACK') {
            E.sendStopPlayback()
            F.alertBannerRed(m.INFO)
            return

        } else if (m.name == 'LOGPLAYER') {
            P.updatePlaybackMenu(m.CURRENT, m.TOTAL, m.PERCENT)
            return

        } else if (m.name == 'PATH_ICAROUS' || m.name == 'PATH_ARDUPILOT') {
            if (m.type == 'PASS') {
                F.alertBannerGreen(m.I)
            } else {
                F.alertBannerRed(m.I + m.name)
            }

        } else if (m.name == 'SAVE') {
            if (MODE.alert) {
                if (m.INFO == 'FAIL') {
                    F.alertBannerRed('Save Failed: ' + m.MSG)
                } else if (m.INFO == 'SUCCESS') {
                    F.alertBannerGreen('Save Succeded: ' + m.MSG)
                }
            }
            return
        } else if (m.name == 'LOAD') {
            if (MODE.alert) {
                if (m.INFO == 'FAIL') {
                    F.alertBannerRed('Load Failed: ' + m.MSG)
                } else if (m.INFO == 'SUCCESS') {
                    F.alertBannerGreen('Load Succeded: ' + m.MSG)
                }
            }
            return
        }


        // check that the ac exists if not create it
        let id = m.AIRCRAFT;
        let ac = AM.getAircraftById(id)

        // if it is a new ac wait for heartbeat before creating new ac
        if (ac == 'Aircraft Not Found' && m.TYPE == 'HEARTBEAT') {
            if (!MODE.flybyfile) {
                let flightmode = m.type
                ac = E.createAircraft(id, flightmode)
            }
        } else if (ac == 'Aircraft Not Found') {
            return
        }

        // sort through message types and take appropriate action
        if (m.TYPE == 'GLOBAL_POSITION_INT') {
            ac.hasComms = true;
            ac.commsLast = Date.now() / 1000

            // update ac info
            ac.lat = m.lat / 10000000;
            ac.lng = m.lon / 10000000;
            ac.alt = m.alt / 1000;
            ac.rel_alt = m.relative_alt / 1000;
            ac.vx = m.vx / 100;
            ac.vy = m.vy / 100;
            ac.vz = m.vz / 100;
            ac.hdg = m.hdg / 100;
            ac.gps_status = true

            // update icon position
            M.UpdatePosition(ac, ac.lat, ac.lng);

            // update indicators
            I.updateIndicators(ac);

            // Update ic bands (if active)
            if (ac.ic_control === true) {
                M.updateIcBands(ac);
            }

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


            I.updateIndicators(ac);

        } else if (m.TYPE == 'HEARTBEAT') {

            // works with ardupilot, rotorsim always returns '18'
            // HITL on telem link works, not on icarous out link

            if (ac != 'Aircraft Not Found') {

                ac.hasComms = true;
                ac.commsLast = Date.now() / 1000

                if (m.type == 14) {
                    let flightmode = m.base_mode
                    if (flightmode == '1') {
                        ac.flightmode = 'PRE-FLIGHT';

                    } else if (flightmode == 81) {
                        ac.flightmode = 'STABILIZE DISARMED';
                    } else if (flightmode == 209) {
                        ac.flightmode = 'STABILIZE ARMED';

                    } else if (flightmode == 89) {
                        ac.flightmode = 'GUIDED DISARMED';
                    } else if (flightmode == 217) {
                        ac.mode = 'GUIDED ARMED';

                    } else if (flightmode == 93) {
                        ac.flightmode = 'AUTO DISARMED';
                    } else if (flightmode == 221) {
                        ac.flightmode = 'AUTO ARMED';
                    } else if (flightmode == 0) {
                        ac.flightmode == 'UNKNOWN'
                    }

                    if (ac.parameters.length == 0) {
                        let msg = 'AIRCRAFT ' + ac.id + ' UPDATE_PARAM_LIST'
                        sendFullMessage(msg)
                    }

                } else if (m.type == 18) {
                    let icflightmode = m.custom_mode
                    if (icflightmode == 0) {
                        ac.icflightmode = 'IDLE'
                    } else if (icflightmode = 1) {
                        ac.icflightmode = 'TAKEOFF'
                    } else if (icflightmode = 2) {
                        ac.icflightmode = 'CLIMB'
                    } else if (icflightmode = 3) {
                        ac.icflightmode = 'CRUISE'
                    } else if (icflightmode = 4) {
                        ac.icflightmode = 'APPROACH'
                    } else if (icflightmode = 5) {
                        ac.icflightmode = 'LAND'
                    }
                }
            }

        } else if (m.TYPE == 'COMMAND_ACK') {
            // [AIRCRAFT, 1, COMMAND_ACK, command, 11, result, 0]
            if (m.result != 0) {
                console.log('Last Command Sent Failed')
            }

        } else if (m.TYPE == 'TRAFFIC') {
            // check mode settings
            if (MODE.sim && (m.emitter_type == 255)) {
                T.UpdateTraffic(m.ICAO_address, 'SIM', m.lat, m.lon, m.hor_velocity, m.heading, m.altitude, 255, m.AIRCRAFT, m.callsign)
                T.updateTrafficSummaryPanel()
            }
            if (MODE.adsb && (m.emitter_type == 100)) {
                T.UpdateTraffic(m.ICAO_address, 'SENSOR', m.lat, m.lon, m.hor_velocity, m.heading, m.altitude, 0, m.AIRCRAFT, m.callsign)
                T.updateTrafficSummaryPanel()
            }
            if (MODE.sensor && (m.emitter_type == 0)) {
                T.UpdateTraffic(m.ICAO_address, 'ADSB', m.lat, m.lon, m.hor_velocity, m.heading, m.altitude, 100, m.AIRCRAFT, m.callsign)
                T.updateTrafficSummaryPanel()
            }

        } else if (m.TYPE == 'ICAROUS_KINEMATIC_BANDS') {
            ac.ic_control = true;
            ac.ic_last = Date.now()
            let type = 0
            let band = 0
            let set = true
            let clear = {
                'FAR': [
                    [],
                    []
                ],
                'MID': [
                    [],
                    []
                ],
                'NEAR': [
                    [],
                    []
                ],
                'RECOVERY': [
                    [],
                    []
                ],
                'UNKNOWN': [
                    [],
                    []
                ],
                'NONE': [
                    [],
                    []
                ]
            }
            let lookup = ''
            let num = 5

            type = Math.floor(m['type1'] / 7) // should be good for whole message

            ac.bands.ic_bands.type[type].num_bands = m.numBands
            set = ac.bands.ic_bands.type[type].set_recieved

            if (m.numBands <= 5) {
                num = m.numBands
                set = true
            }
            if (set) {
                ac.bands.ic_bands.type[type].bands = clear
                ac.bands.ic_bands.type[type].set_recieved = false
            }

            for (let i = 1; i <= num; i++) {
                band = m['type' + i] % 7
                lookup = ac.bands.ic_bands.type_table[band]
                if (band <= 5) {
                    ac.bands.ic_bands.type[type].bands[lookup][0].push(m['min' + i])
                    ac.bands.ic_bands.type[type].bands[lookup][1].push(m['max' + i])

                } else {
                    // clear the bands
                    ac.bands.ic_bands.type[type].set_recieved = true
                    break
                }
            }

        } else if (m.TYPE == 'COMMAND_LONG') {
            console.log(m)
            if (parseInt(m.command) == 31014) {
                console.log(m)
                let lat = m.param1
                let lng = m.param2
                let alt = m.param3
                if (lat != 0 && lng != 0) {
                    M.setS2Dsite(ac, lat, lng, alt)
                }
            }

        } else if (m.TYPE == 'STATUSTEXT') {

            if (m.severity >= 4) {
                F.alertBannerGreen('Aircraft ' + ac.id + ' STATUSTEXT ' + m.severity + ': ' + m.text)
            } else if (m.severity == 3) {
                F.alertBannerYellow('Aircraft ' + ac.id + ' STATUSTEXT ' + m.severity + ': ' + m.text)
            } else if (m.severity == 2) {
                F.alertBannerOrange('Aircraft ' + ac.id + ' STATUSTEXT ' + m.severity + ': ' + m.text)
            } else if (m.severity == 1) {
                F.alertBannerRed('Aircraft ' + ac.id + ' STATUSTEXT ' + m.severity + ': ' + m.text)
            }

            // Use the call sign as the ac name
            if (m.text.includes('CALLSIGN')) {
                ac.callsign = m.text.split(':')[1]
                if (ac.name == ac.id) {
                    ac.name = ac.callsign
                }
                E.updatePanels(ac)
                M.DrawFlightPlan()
            }

        } else if (m.TYPE == 'WP') {
            E.wpInMessage(m, ac)

        } else if (m.TYPE == 'GF') {
            GE.gfInMessage(m, ac)

        } else if (m.TYPE == 'REPLAN') {
            // console.log(m)
            let newLatLng;
            let wp;
            let count = 0
            // remove markers from the map
            for (let item of ac.replan) {
                M.removeMarkerFromLayer(ac.id, item.wpMarker)
            }
            ac.replan = []
            for (let item of m.LIST) {
                if (item.LAT != 0 || item.LNG != 0) {
                    // define wp
                    newLatLng = new L.LatLng(item.LAT, item.LNG)
                    wp = new W.Waypoint(newLatLng, item.ALT);

                    // add a marker
                    wp.wpMarker = M.defineWPMarker(newLatLng, ac.id);
                    M.addMarkerToLayer(ac.id, wp.wpMarker)

                    // update the plan
                    ac.replan[count] = wp;

                    count += 1
                }
            }
            M.DrawRePlan();

        } else if (m.TYPE == 'PARAM_VALUE') {
            if (ac != 'Aircraft Not Found') {
                // stat runtime updates constantly and is annoying
                let annoying = ["STAT_RUNTIME", "STAT_FLTTIME"]
                if (!annoying.includes(m.param_id)) {

                    let new_param = {
                        'name': m.param_id,
                        'value': m.param_value,
                        'type': m.param_type,
                        'index': m.param_index
                    }
                    // update the ac
                    ac.parameters[m.param_index] = new_param;

                    // update the well clear volume
                    if (new_param['name'] == 'DET_1_WCV_DTHR') {
                        ac.icRad = new_param['value'] / 3 // adjust for change from metric to dirty units
                        M.UpdatePosition(ac, ac.lat, ac.lng)
                    }

                    // add radius for merging and spacing
                    if (m.param_id == 'SCHEDULE_ZONE') {
                        ac.schedule_zone = m.param_value
                    } else if (m.param_id == 'ENTRY_RADIUS') {
                        ac.entry_radius = m.param_value
                    } else if (m.param_id == 'COORD_ZONE') {
                        ac.coord_zone = m.param_value
                    }
                }
            }

        } else if (m.TYPE == 'MISSION_CURRENT') {
            // draw the radii for merging and spacing around this point
            ac.mission_current = m.seq
            M.DrawFlightPlan()

        } else if (m.TYPE == 'WAYPOINTLOAD') {
            // add messages to loading div
            let msg = document.createElement('P')
            msg.innerHTML = m.INFO
            try {
                document.getElementById('loading_sendwaypoints_' + ac.id).appendChild(msg)
            } catch {
                console.log('Loading Panel Not Found. (This must not be my ac)')
            }
            if (m.INFO == 'LOAD FAILED TIMEOUT REACHED') {
                F.alertBannerRed('Load Failed: Timout Reached')
                // go back to planning page
                ac.status = 0
                F.makePanelActive('ac_pan_' + ac.id)
                M.DrawFlightPlan()
            } else if (m.INFO == 'SUCCESS') {
                sendFullMessage('AIRCRAFT ' + ac.id + ' REQUEST_WAYPOINTS ' + ac.id)
                // go to info page
                F.makePanelActive('ac_info_pan_' + ac.id)
            }

        } else if (m.TYPE == 'STARTFLIGHT') {
            // add messages to loading div
            let msg = document.createElement('P')
            msg.innerHTML = m.INFO
            try {
                document.getElementById('loading_startflight_' + ac.id).appendChild(msg)
            } catch {
                console.log('Loading Panel Not Found. (This must not be my ac)')
            }
            if (m.INFO == 'FAIL') {
                F.alertBannerRed('Start Flight Failed')
                // go back to info
                F.makePanelActive('ac_info_pan_' + ac.id)

            } else if (m.INFO == 'SUCCESS') {
                // go to inFlight page
                F.makePanelActive('ac_inFlight_pan_' + ac.id)
            }

        } else if (m.TYPE == 'GEOFENCELOAD') {
            let msg = document.createElement('p')
            msg.innerHTML = m.INFO

            let x = document.getElementById('sendgeofence')
            if (x) {
                x.appendChild(msg)
            }
            if (m.INFO == 'FAIL') {
                F.alertBannerRed('Load Failed: Timeout Reached')
                let pan = document.getElementById('loading_ac_sendgeofence')
                console.log(pan)
                let id = pan.getAttribute('fence')
                console.log(id)
                let f = F.getFenceById(id, ac)
                f.submitted = false
                ac.activeSubPanels.splice(ac.activeSubPanels.indexOf('loading_ac_sendgeofence'))
                ac.activeSubPanels.push('ac_geofence_pan_' + f.id + '_' + ac.id)
                F.makePanelActive('ac_' + ac.prev_panel + '_' + ac.id)
            } else if (m.INFO == 'SUCCESS') {
                // remove the loading panel
                let pan = document.getElementsByClassName('active loading geofence')
                for (let item of pan) {
                    item.parentNode.removeChild(item)
                }
                // update the ac
                ac.activeSubPanels.splice(ac.activeSubPanels.indexOf('loading_ac_sendgeofence'))
                ac.activeSubPanels.push('ac_geofence_summary')
                F.makePanelActive('ac_' + ac.prev_panel + '_' + ac.id)
            }

        } else if (m.TYPE == 'BATTERY_STATUS') {
            // update aircraft
            ac.voltage = parseFloat(m.voltages.slice(0, 2) + '.' + m.voltages.slice(2))
            ac.current = m.current_battery
            ac.battery_remaining = m.battery_remaining

            let bat = document.getElementById('battery_' + ac.id)
            if (bat && ac.battery_remaining >= 50) {
                bat.setAttribute('class', 'green')
            } else if (bat && ac.battery_remaining >= 20) {
                bat.setAttribute('class', 'yellow')
            } else if (bat) {
                bat.setAttribute('class', 'red')
            }

        } else if (m.TYPE == 'RADIO_QUALITY') {
            ac.radio_percent = m.PERCENT
            ac.radio_missing = m.MISSING
            let radio = document.getElementById('radio_' + ac.id)
            if (radio && m.PERCENT >= 90) {
                radio.setAttribute('class', 'green')
            } else if (radio && m.PERCENT >= 80) {
                radio.setAttribute('class', 'yellow')
            } else if (radio) {
                radio.setAttribute('class', 'red')
            }


        } else if (m.TYPE == 'GPS_RAW_INT' || m.TYPE == 'GPS_STATUS' || m.TYPE == 'GPS_RAW') {
            ac.satellites_visible = m.satellites_visible
            let gps = document.getElementById('gps_' + ac.id)
            if (gps && m.satellites_visible >= 12) {
                gps.setAttribute('class', 'green')
            } else if (gps && m.satellites_visible >= 9) {
                gps.setAttribute('class', 'yellow')
            } else if (gps) {
                gps.setAttribute('class', 'green')
            }

        } else {
            // console.log('Unknown Message Received: ');
            // console.log(m);
        }
    }
}


/**
 * @function <a name="sendMessage">sendMessage</a>
 * @description Send message to server. Auto prefixed by active aircraft id.
 * @param out_message {string} Message to be send.
 * @memberof module:comms
 */
export function sendMessage(out_message) {
    let ac = AM.getActiveAc()
    let id;
    if (ac == null) {
        id = 'None'
    } else {
        id = ac.id
    }
    connection.send('AIRCRAFT ' + id + ' ' + out_message);
    // console.log('Sent Message: ' + 'AIRCRAFT ' + id + ' ' + out_message);
    // console.trace()
}

/**
 * @function <a name="sendFullMessage">sendFullMessage</a>
 * @description Send message to server. No prefix added.
 * @param out_message {string} Message to be send.
 * @memberof module:comms
 */
export function sendFullMessage(out_message) {
    connection.send(out_message)
    // console.log('Send Full Message: ' + out_message)
    // console.trace()
}


/**
 * @function <a name="periodicEvents">periodicEvents</a>
 * @description Run every 5 sec. Checks for lost comms and loading status.
 * @param none
 * @memberof module:comms
 */
function periodicEvents_5() {
    // No need for loading panels in playback
    if (MODE.mode == 'Playback') {
        return
    }

    // TODO: will error if ac shutdown before loading finishes
    AM.getAircraftList().forEach(function (el) {
        // check start up loading status
        let loading = document.getElementById('loading_startup_' + el.id)
        let x = false;

        if (loading != null) {
            loading.classList.forEach(function (ele) {
                if (ele == 'active') {
                    x = true;
                }
            })
        }

        if (el.hasComms && x) {
            F.makePanelActive('ac_pan_' + el.id)
        }

        // Move to loading page if lost comms with ac
        if (Date.now() / 1000 - el.commsLast >= comms_timeout) {
            el.hasComms = false;
            let ac = AM.getActiveAc()
            let ac_id
            if (ac && ac != 'Aircraft Not Found') {
                ac_id = ac.id
            }
            if (ac_id && el.id == ac_id) {
                F.makePanelActive('loading_startup_' + el.id)
            }
            el.gps_status = false
        }
    })
}



function periodicEvents_3() {
    if (MODE.Tadsb && MODE.mode == 'SITL') {
        for (let ac of AM.aircraft_list) {
            for (let t of ac.traffic_list) {
                if (Date.now() - t.lastUpdate > 2000 && t.inFlight) {
                    TE.removeTraffic(ac, t)
                }
            }
        }
    }
}


function periodicEvents_1() {
    let m
    // limited to SITL for now
    // TODO: Expand to HITL
    if (MODE.Tadsb && MODE.mode == 'SITL') {
        for (let ac of AM.aircraft_list) {
            for (let a of AM.aircraft_list) {
                if (a.id != ac.id) {
                    m = 'AIRCRAFT ' + a.id + ' ADSB_VEHICLE ' + ac.id + ' ' + ac.vx + ' ' + ac.vy + ' ' + ac.vz + ' ' + ac.lat + ' ' + ac.lng + ' ' + ac.rel_alt
                    sendFullMessage(m)
                }
            }
        }
    }

    let ac = AM.getActiveAc()
    if (!(ac == 'Aircraft Not Found' || ac == null)) {
        if (ac.status == 1) {
            F.setPanelInfo(ac, 'pre_flight_info_div_')
        } else if (ac.status == 2) {
            F.setPanelInfo(ac, 'flight_info_div_')
        }
    }
}