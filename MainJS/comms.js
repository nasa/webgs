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




import * as form from './form.js'
import * as map from './map.js'
import * as Aircraft from './aircraft.js'
import * as E from './eventFunctions.js'
import * as I from '../Indicators/indicators.js'
import * as IC from './icSettings.js'
import * as user from './updateUser.js'
import * as P from './playback.js'

import * as Traffic from '../Traffic/traffic.js'
import * as F from '../Geofence/geofence.js'
import * as FE from '../Geofence/geofenceEvents.js'



let aircraft_list = [];
let comms_timeout = 10
export let ip_used = '0.0.0.0'
export let port_used = 8000

/**
 * @function <a name="getAircraftList">getAircraftList</a>
 * @description get the aircraft list.
 * @todo Export the list instead.
 * @memberof module:comms
 */
export function getAircraftList() {
    return aircraft_list;
}

/**
 * @function <a name="removeFromAircraftList">removeFromAircraftList</a>
 * @description Remove an aircraft from the aircraft list.
 * @param ac {Object} Aircraft Object.
 * @memberof module:comms
 */
export function removeFromAircraftList(ac) {
    aircraft_list = aircraft_list.filter(el => {
        return el.id != ac.id
    })
}

/**
 * @function <a name="pushToAircraftList">pushToAircraftList</a>
 * @description Push an aircraft to the aircraft list.
 * @param ac {Object} Aircraft Object.
 * @memberof module:comms
 */
export function pushToAircraftList(ac) {
    aircraft_list.push(ac);
}

/**
 * @function <a name="createNewConnection">createNewConnection</a>
 * @description Create a new websocket connection.
 * @param none
 * @memberof module:comms
 */
export function createNewConnection() {
    let ip = document.getElementById('new_ip__input').value
    let port = document.getElementById('new_port__input').value
    if (window.connection.readyState == 1) {
        window.connection.close(1000, 'Changing Connection')
    }
    // set ip and port in mode
    createConnection(ip, port)
}

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
    window.connection = new WebSocket('ws://' + ip + ':' + port);

    connection.onopen = function (event) {
        // update user settings
        user.readSettings()
        console.log('Connection Established: ws://' + ip + ':' + port)
        form.alertBannerGreen('Connection Established: ws://' + ip + ':' + port)
        ip_used = ip
        port_used = port
        let MODE = E.getMode()
        MODE.con_status = 'Connection Status: Connected'
        form.updateSettingsPanel()

        connection.send('Connection Established');

        setInterval(periodicEvents, 5000);
        window.addEventListener('unload', function () {
            window.connection.close(1000, 'Closing or Refreshing')
        })

        MODE.ipAddress = ip_used
        MODE.port = port_used
    };

    connection.onclose = function (event) {
        console.log('Closing Connection: ws://' + ip + ':' + port)
        if (event.code == 1006) {

            let MODE = E.getMode()
            // MODE.observeonly = true
            MODE.con_status = 'Connection Status: Disconnected'
            form.updateSettingsPanel()

            form.alertBannerRed('Unable to connect. Please check the IP address and port, and then try again.')
        } else {
            let MODE = E.getMode()
            // MODE.observeonly = true
            MODE.con_status = 'Connection Status: Disconnected'
            form.updateSettingsPanel()
            form.alertBannerRed('Unable to connect. Please check the IP address and port, and then try again.', event.code)
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
            // TODO: hide this before release
            console.log(event.data)
            console.log(e)
            return
        }

        let MODE = E.getMode()

        if (m.name == 'HITL') {
            if (m.INFO == 'CONNECTION_FAILED') {
                form.alertBannerRed('Connection Failed. Please check the settings, and try again.')
            }
            console.log(m)
            return

        } else if (m.TYPE == 'CONNECTING') {
            form.alertBannerRed('Waiting for Heartbeat')
            return

        } else if (m.name == 'SHUT_DOWN') {
            // handles multi-user ac shutdown
            // check for ac in list
            let ac = Aircraft.getAircraftById(m.AIRCRAFT)
            if (ac != 'Aircraft Not Found') {
                // shutdown ac
                Aircraft.acShutdown(ac, false)
            } else if (m.AIRCRAFT == 'PLAYBACK') {
                for (let ac of aircraft_list) {
                    Aircraft.acShutdown(ac, false)
                }
            }
            return

        } else if (m.name == 'USER_SETTINGS') {
            user.updateModeFromFile(m)
            return

        } else if (m.name == 'USER_SETTINGS_RESET') {
            console.log(m)
            user.updateModeFromFile(m)
            form.alertBannerGreen('Settings Reset to Default')
            return

        } else if (m.name == 'USER_SETTINGS_SAVED') {
            console.log(m.INFO)
            form.alertBannerGreen(m.INFO)
            return

        } else if (m.name == 'IC_PLAYBACK') {
            E.sendStopPlayback()
            form.alertBannerRed(m.INFO)
            return

        } else if (m.name == 'LOGPLAYER') {
            P.updatePlaybackMenu(m.CURRENT, m.TOTAL, m.PERCENT)
            return

        } else if (m.name == 'PATH_ICAROUS' || m.name == 'PATH_ARDUPILOT') {
            if (m.type == 'PASS') {
                form.alertBannerGreen(m.I)
            } else {
                form.alertBannerRed(m.I + m.name)
            }

        } else if (m.name == 'ICAROUS_APPS') {
            if (m.INFO == 'FILE_WRITE_SUCCESS') {
                form.alertBannerGreen('FILE_WRITE_SUCCESS')
                return

            } else if (m.INFO == 'FILE_WRITE_FAIL') {
                form.alertBannerRed('FILE_WRITE_FAIL')
                return

            } else {
                // remove the loading panel
                let pan = document.getElementsByClassName('active loading ic')
                for (let item of pan) {
                    item.parentNode.removeChild(item)
                }

                // add apps to MODE.icSettings
                MODE.icSettings = IC.getIcApps()
                MODE.icSettings.clearList()

                // check for valid apps to display
                if (m.INFO.length <= 1) {
                    return
                }

                for (let i of m.INFO) {
                    let name = i.NAME
                    let active = function () {
                        if (i.ACTIVE == 'True') {
                            return true
                        } else {
                            return false
                        }
                    }
                    MODE.icSettings.addApp(name, active())
                    // check which sim is active and update MODE
                    if (name == 'RotorSim' && active()) {
                        MODE.sim_type = 'RotorSim'
                    }
                    if (name == 'ARDUPILOT' && active()) {
                        MODE.sim_type = 'ARDUPILOT'
                    }
                }
                // create the ic settings sub panel if needed
                let icsub = document.getElementById("ic_settings_pan")
                if (!icsub) {
                    IC.createIcSettingsPanel()
                }

                // update the sub panel
                IC.updateIcSettingsPanel()

                // make the sub panel active
                MODE.activeSubPanels = []
                MODE.activeSubPanels.push('ic_settings_pan')
                form.makePanelActive('settings')
                return
            }

        } else if (m.name == 'SAVE') {
            if (MODE.alert) {
                if (m.INFO == 'FAIL') {
                    form.alertBannerRed('Save Failed: ' + m.MSG)
                } else if (m.INFO == 'SUCCESS') {
                    form.alertBannerGreen('Save Succeded: ' + m.MSG)
                }
            }
            return
        } else if (m.name == 'LOAD') {
            if (MODE.alert) {
                if (m.INFO == 'FAIL') {
                    form.alertBannerRed('Load Failed: ' + m.MSG)
                } else if (m.INFO == 'SUCCESS') {
                    form.alertBannerGreen('Load Succeded: ' + m.MSG)
                }
            }
            return
        }


        // check that the ac exists if not create it
        let id = m.AIRCRAFT;
        let ac = Aircraft.getAircraftById(id)

        // if it is a new ac wait for heartbeat before creating new ac
        if (ac == 'Aircraft Not Found' && m.TYPE == 'HEARTBEAT') {
            let MODE = E.getMode()
            if (!MODE.flybyfile) {
                let flightmode = m.type
                ac = createAircraft(id, flightmode)
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
            map.UpdatePosition(ac, ac.lat, ac.lng);

            // update indicators
            I.updateIndicators(ac);

            // Update ic bands (if active)
            if (ac.ic_control === true) {
                map.updateIcBands(ac);
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

            if (ac.status == 1) {
                form.setPanelInfo(ac, 'pre_flight_info_div_')
            } else if (ac.status == 2) {
                form.setPanelInfo(ac, 'flight_info_div_')
            }
            I.updateIndicators(ac);

        } else if (m.TYPE == 'HEARTBEAT') {
            let flightmode = m.base_mode

            // works with ardupilot, rotorsim always returns '18'
            // HITL on telem link works, not on icarous out link
            if (ac != 'Aircraft Not Found') {
                ac.hasComms = true;
                ac.commsLast = Date.now() / 1000
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
                }

                //  TODO: Make sure this is the only place we do this
                if (ac.parameters.length == 0) {
                    let msg = 'AIRCRAFT ' + ac.id + ' UPDATE_PARAM_LIST'
                    sendFullMessage(msg)
                }
            }


        } else if (m.TYPE == 'COMMAND_ACK') {
            // [AIRCRAFT, 1, COMMAND_ACK, command, 11, result, 0]
            if (m.result != 0) {
                console.log('Last Command Sent Failed')
            }

        } else if (m.TYPE == 'TRAFFIC') {
            // check mode settings
            let MODE = E.getMode()
            if (MODE.sim && (m.emitter_type == 255)) {
                Traffic.UpdateTraffic(m.ICAO_address, 'SIM', m.lat, m.lon, m.hor_velocity, m.heading, m.altitude, 255, m.AIRCRAFT)
                Traffic.updateTrafficSummaryPanel()
            }
            if (MODE.adsb && (m.emitter_type == 100)) {
                Traffic.UpdateTraffic(m.ICAO_address, 'SENSOR', m.lat, m.lon, m.hor_velocity, m.heading, m.altitude, 0, m.AIRCRAFT)
                Traffic.updateTrafficSummaryPanel()
            }
            if (MODE.sensor && (m.emitter_type == 0)) {
                Traffic.UpdateTraffic(m.ICAO_address, 'ADSB', m.lat, m.lon, m.hor_velocity, m.heading, m.altitude, 100, m.AIRCRAFT)
                Traffic.updateTrafficSummaryPanel()
            }

        } else if (m.TYPE == 'ICAROUS_KINEMATIC_BANDS') {
            ac.ic_control = true;
            ac.ic_last = Date.now()
            let num_bands = m.numBands
            let min = [];
            let max = [];
            let count = 0;
            // find the danger area or areas
            for (let i = 1; i <= num_bands; i++) {
                if (m['type' + i] === 3) {
                    min[count] = m['min' + i]
                    max[count] = m['max' + i]
                    count++;
                }
            }
            ac.bands = [min, max]
            map.drawBands(ac)

        } else if (m.TYPE == 'COMMAND_LONG') {
            console.log(m)
            if (parseInt(m.command) == 31014) {
                console.log(m)
                let lat = m.param1
                let lng = m.param2
                let alt = m.param3
                if (lat != 0 && lng != 0) {
                    map.setS2Dsite(ac, lat, lng, alt)
                }
            }

        } else if (m.TYPE == 'STATUSTEXT') {

            if (m.severity >= 4) {
                form.alertBannerGreen('Aircraft ' + ac.id + ' STATUSTEXT ' + m.severity + ': ' + m.text)
            } else if (m.severity == 3) {
                form.alertBannerYellow('Aircraft ' + ac.id + ' STATUSTEXT ' + m.severity + ': ' + m.text)
            } else if (m.severity == 2) {
                form.alertBannerOrange('Aircraft ' + ac.id + ' STATUSTEXT ' + m.severity + ': ' + m.text)
            } else if (m.severity == 1) {
                form.alertBannerRed('Aircraft ' + ac.id + ' STATUSTEXT ' + m.severity + ': ' + m.text)
            }

        } else if (m.TYPE == 'WP') {
            wpInMessage(m, ac)

        } else if (m.TYPE == 'GF') {
            gfInMessage(m, ac)

        } else if (m.TYPE == 'REPLAN') {
            console.log(m)
            let newLatLng;
            let wp;
            let count = 0
            // remove markers from the map
            for (let item of ac.replan) {
                map.removeMarkerFromLayer(ac.id, item.wpMarker)
            }
            ac.replan = []
            for (let item of m.LIST) {
                if (item.LAT != 0 || item.LNG != 0) {
                    // define wp
                    newLatLng = new L.LatLng(item.LAT, item.LNG)
                    wp = new Aircraft.Waypoint(newLatLng, item.ALT);

                    // add a marker
                    wp.wpMarker = map.defineWPMarker(newLatLng, ac.id);
                    map.addMarkerToLayer(ac.id, wp.wpMarker)

                    // update the plan
                    ac.replan[count] = wp;

                    count += 1
                }
            }
            map.DrawRePlan();

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
                        map.UpdatePosition(ac, ac.lat, ac.lng)
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
            map.DrawFlightPlan()

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
                form.alertBannerRed('Load Failed: Timout Reached')
                // go back to planning page
                ac.status = 0
                form.makePanelActive('ac_pan_' + ac.id)
                map.DrawFlightPlan()
            } else if (m.INFO == 'SUCCESS') {
                sendFullMessage('AIRCRAFT ' + ac.id + ' REQUEST_WAYPOINTS ' + ac.id)
                // go to info page
                form.makePanelActive('ac_info_pan_' + ac.id)
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
                form.alertBannerRed('Start Flight Failed')
                // go back to info
                form.makePanelActive('ac_info_pan_' + ac.id)

            } else if (m.INFO == 'SUCCESS') {
                // go to inFlight page
                form.makePanelActive('ac_inFlight_pan_' + ac.id)
            }

        } else if (m.TYPE == 'GEOFENCELOAD') {
            let msg = document.createElement('p')
            msg.innerHTML = m.INFO
            document.getElementById('sendgeofence').appendChild(msg)
            if (m.INFO == 'FAIL') {
                form.alertBannerRed('Load Failed: Timeout Reached')
                let pan = document.getElementById('loading_ac_sendgeofence')
                console.log(pan)
                let id = pan.getAttribute('fence')
                console.log(id)
                let f = F.getFenceById(id, ac)
                f.submitted = false
                ac.activeSubPanels.splice(ac.activeSubPanels.indexOf('loading_ac_sendgeofence'))
                ac.activeSubPanels.push('ac_geofence_pan_' + f.id + '_' + ac.id)
                form.makePanelActive('ac_' + ac.prev_panel + '_' + ac.id)
            } else if (m.INFO == 'SUCCESS') {
                // remove the loading panel
                let pan = document.getElementsByClassName('active loading geofence')
                for (let item of pan) {
                    item.parentNode.removeChild(item)
                }
                // update the ac
                ac.activeSubPanels.splice(ac.activeSubPanels.indexOf('loading_ac_sendgeofence'))
                ac.activeSubPanels.push('ac_geofence_summary')
                form.makePanelActive('ac_' + ac.prev_panel + '_' + ac.id)
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
    let MODE = E.getMode()
    // if (MODE.observeonly) {
    //     return
    // }
    let ac = Aircraft.getActiveAc()
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
    let MODE = E.getMode()
    // if (MODE.observeonly) {
    //     return
    // }
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
function periodicEvents() {
    // No need for loading panels in playback
    let MODE = E.getMode()
    if (MODE.mode == 'Playback') {
        return
    }

    // TODO: will error if ac shutdown before loading finishes
    getAircraftList().forEach(function (el) {
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
            form.makePanelActive('ac_pan_' + el.id)
        }

        // Move to loading page if lost comms with ac
        if (Date.now() / 1000 - el.commsLast >= comms_timeout) {
            el.hasComms = false;
            if (el.id == Aircraft.getActiveAc().id) {
                form.makePanelActive('loading_startup_' + el.id)
            }
            el.gps_status = false
        }
    })
}

/**
 * @function <a name="createAircraft">createAircraft</a>
 * @description Creates new Aircraft, adds panels, and adds icons to map
 * @param id {string} Aircraft Id
 * @param mode {string} Recieved flight mode
 * @memberof module:comms
 */
function createAircraft(id, mode) {
    let fp = [];
    let ac = new Aircraft.Aircraft(id, aircraft_list, fp);
    let center = map.getCenter()
    ac.lat = center[0]
    ac.lng = center[1]
    ac.status = 0;
    ac.hasComms = true;
    ac.commsLast = Date.now() / 1000
    let MODE = E.getMode()
    ac.mode = MODE.mode

    // only works for ardupilot
    if (mode == '1') {
        ac.flightmode = 'PRE-FLIGHT';
        ac.status = 0;
    } else if (mode == '81') {
        ac.flightmode = 'STABILIZE DISARMED';
        ac.status = 0;
    } else if (mode == '209') {
        ac.flightmode = 'STABILIZE ARMED';
        ac.status = 2;

    } else if (mode == '89') {
        ac.flightmode = 'GUIDED DISARMED';
        ac.status = 0;
    } else if (mode == '217') {
        ac.flightmode = 'GUIDED ARMED';
        ac.status = 2;

    } else if (mode == '93') {
        ac.flightmode = 'AUTO DISARMED';
        ac.status = 0;
    } else if (mode == '221') {
        ac.flightmode = 'AUTO ARMED';
        ac.status = 2;
    } else {
        ac.flightmode = 'UNKNOWN';
    }


    // add it to the list
    aircraft_list.push(ac);
    // add to drop down list
    form.updateAcInMenu()
    // create panels
    form.createFlightPlanPanel(ac);
    form.createLoadingPanel('startup', ac)
    form.makePanelActive('ac_pan_' + ac.id)

    // check for loaded wp's
    sendMessage('REQUEST_WAYPOINTS ' + ac.id);
    sendMessage('REQUEST_FENCE ' + ac.id)
    sendMessage('REQUEST_REPLAN ' + ac.id)

    // draw the marker - keep this after request wp's
    // has issues auto drawing all of the flight plans
    // will hide any created after the initial ac sometimes
    map.addNewLayerGroup(ac);

    console.log('created ac ' + ac.id, ac)
    return ac
}

export function wpInMessage(m, ac) {
    console.log(m)
    // clear the rows from the table
    let table = document.getElementById('ac_fp_table_' + ac.id)
    let rows = document.getElementsByClassName('fp_row')
    let rcl;
    for (let i = rows.length - 1; i >= 0; i--) {
        rcl = rows[i].id.split('_')
        if (rcl[2] == ac.id.toString()) {
            rows[i].parentNode.removeChild(rows[i])
        }
    }
    rows = document.getElementsByClassName('fp_rows')

    // handle wp loaded from file
    let file = false
    if (m.FILE == 'true') {
        file = true
    }

    // remove markers from the map
    for (let item of ac.flightplan) {
        map.removeMarkerFromLayer(ac.id, item.wpMarker)
    }

    ac.flightplan = []
    let newLatLng;
    let wp;
    let count = 0
    let v
    let vel = m.VEL


    // update the input box
    try {
        if (vel > 0) {
            ac.u_vel = vel
            v = document.getElementById('VEL_Velocity: m/s _' + ac.id)
            v.value = vel
        }
    } catch (e) {
        console.log(e)
    }

    for (let item of m.LIST) {
        if (item.LAT != 0 || item.LNG != 0) {
            // define wp
            newLatLng = new L.LatLng(item.LAT, item.LNG)
            wp = new Aircraft.Waypoint(newLatLng, item.ALT);

            // add a marker
            wp.wpMarker = map.defineWPMarker(newLatLng, ac.id);
            map.addMarkerToLayer(ac.id, wp.wpMarker)

            // update the flight plan
            ac.flightplan[count] = wp;
            if (ac.status < 2) {
                // add new row for wp
                form.updateTable(table, ac.id, 'fp', count, E.clickAddRowButton, E.clickRemoveRowButton)

                // update row values
                map.setRowValue(ac.id, 'fp', count, item.LAT, item.LNG, item.ALT)
            }
            count += 1
        }
    }
    // check the ac status, wp's loaded from file are not on the ac yet
    if (ac.status < 2) {
        if (file) {
            ac.status = 0
        } else {
            if (ac.flightplan.length > 1) {
                ac.status = 1
            } else {
                ac.status = 0
            }
        }
    }
    // make the correct panel active
    form.makePanelActive('ac_pan_' + ac.id)

    // Re draw the flight plan
    map.DrawFlightPlan();
}

export function gfInMessage(m, ac) {
    console.log(m)
    if (m.FILE == 'True') {
        let fence = F.getActiveFence(ac)
        // console.log(fence)
        let pan = document.getElementById('ac_geofence_pan_' + fence.id + '_' + ac.id)
        // console.log('ac_geofence_pan_' + fence.id + '_' + ac.id)
        // console.log(pan)
        if (pan != null) {
            // console.log(fence.id)
            FE.removeGf(ac, fence, pan)
        }
    }

    // remove all geofences from the map
    for (let ac of aircraft_list) {
        for (let f of ac.gf_list) {
            if (f.fenceLine != null) {
                F.removeGfMarker(ac.id, f.fenceLine)
                f.fenceLine = null
            }
        }
    }

    // create new fence and point objects
    let n
    let f
    let center
    let row
    let d
    for (let i of m.LIST) {
        // create plan panel
        // console.log(m)
        if (m.FILE == 'False') {
            // check if this fence exists
            d = F.getFenceBySeq(i.id, ac)
            if (d != 'GeoFence not found') {
                FE.removeGf(ac, d, document.getElementById('ac_geofence_pan_' + d.id + '_' + ac.id))
            }
        }
        FE.addGF(ac, i.Vertices[0])
        f = ac.gf_list[ac.gf_list.length - 1]
        f.type = i.type
        n = i.numV
        f.floor = i.floor
        f.roof = i.roof

        // add the verticies
        for (let x = 1; x < n; x++) {
            center = i.Vertices[x]
            row = 'row_geofence_' + ac.id + '_' + f.id + '_' + (x - 1)
            // console.log(x)
            FE.addRow(ac, center, null, row)
        }
        if (m.FILE == 'False') {
            f.submitted = true
            f.seq = i.id
            // should not have planning panel
            let pan1 = document.getElementById('ac_geofence_pan_' + f.id + '_' + ac.id)
            if (pan1) {
                pan1.parentNode.removeChild(pan1)
            }
            F.clearSubpanelsFromList(ac)

        } else {
            // make sure floor and roof inputs are updated
            let floor = document.getElementById('gf_floor_GF Floor_' + f.id + '_' + ac.id)
            let roof = document.getElementById('gf_roof_GF Roof_' + f.id + '_' + ac.id)
            floor.value = f.floor
            roof.value = f.roof
        }
    }

    // update the map with lines
    F.drawGeofences()
    F.updateFenceSummaryPanel()
    // make the correct panel active
    form.makePanelActive('ac_pan_' + ac.id)
    // Re draw the flight plan
    map.DrawFlightPlan();
    // console.log(ac.gf_list)
}