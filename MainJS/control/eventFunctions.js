/**
 *
 * @module eventFunctions
 * @version 1.0.1
 * @description <b> Library of event handlers. </b>
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
} from '../control/entry.js'

import * as C from '../control/comms.js'
import * as S from '../control/saveFile.js'
import * as P from '../control/playback.js'

import * as A from '../models/aircraft.js'
import * as W from '../models/waypoint.js'

import * as M from '../views/map.js'
import * as F from '../views/form.js'

import * as I from '../Indicators/indicators.js'



/**
 * @function <a name="loadBody">loadBody</a>
 * @description Sets up initial display on page load.
 * @param none
 * @memberof module:eventFunctions
 */
export function loadBody() {

    // mode specific settings
    if (MODE.mode == 'SITL') {
        // Add new aircraft button
        F.updateAcInMenu(false)
    } else if (MODE.mode == 'HITL') {
        // Add new aircraft button
        F.updateAcInMenu(false)
    } else if (MODE.mode == 'Playback') {
        // nothing for now
        console.log('')
    }

    // create div for traffic, geofence, and other info to be displayed
    let option_display = document.createElement('div')
    option_display.setAttribute('class', 'option_display')
    option_display.setAttribute('id', 'option_div')
    document.body.appendChild(option_display)

    // create sub-divs
    let sub_display
    for (let i = 1; i < 7; i++) {
        sub_display = document.createElement('div')
        sub_display.setAttribute('class', 'option_sub_' + i)
        sub_display.setAttribute('id', 'option_div_sub_' + i)
        option_display.appendChild(sub_display)
    }

    // Get ip from address bar
    let ip = document.location.href.replace(/\//g, '').split(':')[1]
    if (ip == 'localhost') {
        ip = '0.0.0.0'
    }
    MODE.protocol = location.protocol
    MODE.ipAddress = ip

    console.log('Attempting to connect to: ', ip)

    // connect with socket server
    C.createConnection(ip, '8083')

    // display the current status
    F.setSummaryPanelInfo()

    // start on the settings page
    F.createSettingsPanel()
    F.makePanelActive('settings')

    setTimeout(function () {
        // check path to icarous
        C.sendFullMessage('CHECK_PATH ' + MODE.ic_path)
        // check path to ardupilot
        C.sendFullMessage('CHECK_PATH_A ' + MODE.ardu_path)
    }, 2000)

    // check local storage
    checkLocalStorage()
}

export function checkLocalStorage() {
    let x
    let skip = ['activeSubPanels', 'context_added', 'flybyfile', 'con_status']
    for (let key in MODE) {
        if (MODE.hasOwnProperty(key) && !skip.includes(key)) {
            x = localStorage.getItem(key)
            if (x) {
                if (x == 'true') {
                    x = true
                } else if (x == 'false') {
                    x = false
                }
                MODE[key] = x
                // console.log(`Local Storage: ${key},\t${x}`)
            }
        }
    }
}

export function setLocalStorage(value, variable) {
    // console.log(`localStorage: var - ${variable}, value - ${value} `)
    window.localStorage.setItem(variable, value)
}


/**
 * @function <a name="checkIfLoading">checkIfLoading</a>
 * @description Helper function. Checks if a loading panel is active.
 * @param none
 * @return {boolean}
 * @memberof moduleeventFunctions
 */
export function checkIfLoading() {
    let act = document.getElementById('loading').classList
    let x = false
    act.forEach(function (el) {
        if (el == 'active') {
            x = true
        }
    })
    return x
}

/**
 * @function <a name="createNewSimAircraftHitl">createNewSimAircraftHitl</a>
 * @description Click handler that passes correct params to createNewAircraft.
 * @todo for now assuming icarous is running on all vehicles
 * @param none
 * @memberof module:eventFunctions
 */
export function createNewSimAircraftHitl() {
    createNewAircraft(null, 1, null, 'SITL')
}

/**
 * @function <a name="createNewAircraftHitl">createNewAircraftHitl</a>
 * @description Click handler that passes correct params to createNewAircraft.
 * @todo for now assuming icarous is running on all vehicles
 * @param none
 * @memberof module:eventFunctions
 */
export function createNewAircraftHITL() {
    createNewAircraft(null, 1, null, 'HITL')
}

/**
 * @function <a name="createNewAircraftFile">createNewSimAircraftFile</a>
 * @description Click handler that passes correct params to createNewAircraft.
 * @param none
 * @memberof module:eventFunctions
 */
export function createNewAircraftFile(n, ic, lat, lng) {
    createNewAircraft(n, ic, [lat, lng], 'SITL')
}

/**
 * @function <a name="createNewAircraft">createNewSimAircraft</a>
 * @description Creates new instance of Aircraft, adds it to the map, and generates panels.
 * @param name {string:optional} Aircraft Name
 * @param ic {Int} 1 - use icarous, 0 - don't use icarous.
 * @param center {Array:optional} Lat, lng pair. Defines start point of wp 0. Defaults to center of map.
 * @param mode {Object:optional} Current Mode. Not used if loading ac from file. It is assumed they will not be HITL
 * @memberof module:eventFunctions
 */
export function createNewAircraft(name = null, ic = 1, center = null, mode = null) {
    // create new aircraft with blank flight plan
    let ac_list = AM.aircraft_list
    let ac_id;
    if (ac_list.length == 0) {
        ac_id = 1
    } else {
        ac_id = ac_list.length + 1
        let id_list = []
        for (let i of ac_list) {
            id_list.push(i.id)
        }
        let x = 0
        while (true) {
            x = x + 1
            if (!id_list.includes(x)) {
                ac_id = x
                break
            }
        }
    }

    let fp = [];
    let ac = new A.Aircraft(ac_id, ac_list, fp);
    ac.icarous = ic
    if (center == null) {
        try {
            ac.lat = e.latlng.lat
            ac.lng = e.latlng.lng
        } catch {
            center = M.getCenter()
            ac.lat = center[0]
            ac.lng = center[1]
        }
    } else {
        ac.lat = center[0]
        ac.lng = center[1]
    }

    if (name == null || typeof name != 'string') {
        ac.name == ac.id
    } else {
        ac.name = name
    }

    if (mode == null) {
        ac.mode = MODE.mode
    } else {
        ac.mode = mode
    }

    // add it to the list
    AM.pushToAircraftList(ac);

    if (mode != 'HITL') {
        // let the server know a new aircraft has been created
        let out_message = 'AIRCRAFT ' + ac.id +
            ' NEW_AIRCRAFT ' +
            ac.id + ' ' +
            ac.lat + ' ' +
            ac.lng + ' ' +
            ac.alt + ' ' +
            ac.hdg + ' ' +
            ac.icarous + ' ' +
            MODE.sim_type + ' ' +
            MODE.ic_path + ' ' +
            MODE.ardu_path;
        C.sendFullMessage(out_message);
    }

    // add a button to the menu
    F.updateAcInMenu()

    // build the panel and wait for heartbeat to make it active
    F.createFlightPlanPanel(ac);
    F.createLoadingPanel('startup', ac)
    F.makePanelActive('loading_startup_' + ac.id)

    // request info from ac
    refreshDisplay(ac)

    // add a layer to the map
    M.addNewLayerGroup(ac);
}

/**
 * @function <a name="clickSummary">clickSummary</a>
 * @description Click handler that opens the summary panel.
 * @param none
 * @memberof module:eventFunctions
 */
export function clickSummary(e) {
    F.setSummaryPanelInfo();
    F.makePanelActive('blank');
}

/**
 * @function <a name="clickSettings">clickSettings</a>
 * @description Click handler that opens the settings panel.
 * @param none
 * @memberof module:eventFunctions
 */
export function clickSettings(e) {
    // remove any old panel
    let old = document.getElementById('settings');
    while (old.hasChildNodes()) {
        old.removeChild(old.firstChild)
    }

    // build the new one
    F.createSettingsPanel();
    F.makePanelActive('settings')
}

/**
 * @function <a name="clickLoadFile">clickLoadFile</a>
 * @description Click handler that opens the file panel.
 * @param none
 * @memberof module:eventFunctions
 */
export function clickLoadFile(e) {
    if (MODE.mode == 'SITL') {
        // load the file
        let fr = new FileReader();
        let file_name = this.files[0].name

        // remove any old panel for this file
        let old = document.getElementById('file_load_' + file_name);
        if (old != null) {
            old.parentNode.removeChild(old);
        }

        // create and make new panel active
        F.createFilePanel('file_load_' + file_name);

        fr.onload = function (e) {
            console.log(fr.result)
            document.getElementById('contents_' + file_name).textContent = fr.result;
        };
        fr.readAsText(this.files[0]);

        // this clears the input and allows the same file to be loaded twice
        document.getElementById('filechoice').value = ''
        F.makePanelActive('file_load_' + file_name);

    } else {
        F.alertBannerRed('Fly By File only works in SITL Mode')
    }
}

// todo: get rid of this use clickSettings
export function clickCancel() {
    // go back to start page
    F.makePanelActive('settings');
}

/**
 * @function <a name="clickACPanelShow">clickACPanelShow</a>
 * @description Click handler that opens an aircraft panel.
 * @param none
 * @memberof module:eventFunctions
 */
export function clickACPanelShow() {
    let ac = getACFromElementId(this.id)
    F.makePanelActive('ac_pan_' + ac.id);
}

/**
 * @function <a name="clickChangeParameters">clickChangeParameters</a>
 * @description Click handler that opens the parameter panel.
 * @param none
 * @memberof module:eventFunctions
 */
export function clickChangeParameters() {
    let ac = getACFromElementId(this.id);
    C.sendMessage('UPDATE_PARAM_LIST')

    // create loading panel
    F.createLoadingPanel('paramupdate', ac)
    // make panel active
    F.makePanelActive('loading_paramupdate_' + ac.id)
    setTimeout(function () {
        console.log('Getting Parameters')
        F.updateParamPanel(ac)
        F.makePanelActive('ac_param_pan_' + ac.id)
    }, 1000)
}

/**
 * @function <a name="onInputHighlight">onInputHighlight</a>
 * @description highlight rows with changed values, 'onInput'
 * @param none
 * @memberof module:eventFunctions
 */
export function onInputHighlight(e) {
    e.path[0].classList.add('highlight_param');
}

/**
 * @function <a name="clickSubmitChanges">clickSubmitChanges</a>
 * @description Submit highlighted parameters to the aircraft. Return to the aircraft panel
 * @param none
 * @memberof module:eventFunctions
 */
export function clickSubmitChanges() {
    let ac = getACFromElementId(this.id);
    // make a list of all the highlighted rows
    let changed = document.getElementsByClassName('highlight_param')
    let name;
    let old_list = [];
    for (let i of changed) {
        name = i.id.split('_')
        name = name.slice(1, name.length - 1).join('_');
        name = name.substr(1)
        // get old value for this parameter
        for (let j in ac.parameters) {
            if (ac.parameters[j].name === name && parseFloat(ac.parameters[j].value) != parseFloat(i.value)) {
                old_list.push({
                    'name': ac.parameters[j].name,
                    'value': ac.parameters[j].value,
                    'type': ac.parameters[j.type]
                });
                if (confirm('Are you sure you want to change ' + name + ' from ' + ac.parameters[j].value + ' to ' + i.value + '?')) {
                    // format message
                    let message = 'CHANGE_PARAM ' + name + ' ' + i.value + ' ' + ac.parameters[j].type;

                    // send change message to server
                    C.sendMessage(message);
                    C.sendMessage('UPDATE_PARAM_LIST')
                } else {
                    console.log('Change param canceled')
                }
            }
        }
    }

    // go back to building flight plan
    F.makePanelActive('ac_pan_' + ac.id);
}

/**
 * @function <a name="clickReloadParameters">clickReloadParameters</a>
 * @description Sends messages to aircraft to resend the parameters. Then reloads the panel with updated values.
 * @param none
 * @memberof module:eventFunctions
 */
export function clickReloadParameters() {
    let ac = getACFromElementId(this.id)
    let message = 'UPDATE_PARAM_LIST';
    C.sendMessage(message)

    setTimeout(function () {
        F.updateParamPanel(ac)
        F.alertBannerGreen('Updated Param List')
    }, 500)
}

/**
 * @function <a name="clickCancelChanges">clickCancelChanges</a>
 * @description return to aircraft panel
 * @param none
 * @memberof module:eventFunctions
 */
export function clickCancelChanges() {
    // go back to building flight plan
    let ac = getACFromElementId(this.id);
    F.makePanelActive('ac_pan_' + ac.id);
}


/**
 * @function <a name="clickSubmitFlightPlan">clickSubmitFlightPlan</a>
 * @description formats and sends a flightplan to the aircraft, draws the plan on the map, then loads info panel.
 * @param none
 * @memberof module:eventFunctions
 */
export function clickSubmitFlightPlan() {
    let ac = getACFromElementId(this.id);
    ac.u_vel = document.getElementById('VEL_Velocity: m/s _' + ac.id).value;

    let wp_string = ac.flightplanToString()

    let message = 'LOAD_FLIGHT_PLAN AC_ID ' + ac.id +
        ' VEL ' + ac.u_vel +
        ' ' + MODE.sim_type +
        ' WP' + wp_string

    // send message to server
    C.sendMessage(message);

    // Update ac
    ac.status = 1;

    // show loading panel
    F.createInfoPanel(ac)
    F.setPanelInfo(ac, 'pre_flight_info_div_')
    F.createLoadingPanel('sendwaypoints', ac)
    F.makePanelActive('loading_sendwaypoints_' + ac.id)

    // redraw the flight plan
    M.DrawFlightPlan();
}

/**
 * @function <a name="scriptSubmitFlightPlan">scriptSubmitFlightPlan</a>
 * @description formats and sends a flightplan to the aircraft, draws the plan on the map, then loads info panel.
 * @param ac {Object} Aircraft object.
 * @param vel {real} Planned aircraft velocity.
 * @param wp_string {string} Flight plan converted to a string.
 * @memberof module:eventFunctions
 */
export function scriptSubmitFlightPlan(ac, vel, wp_string) {
    let message = 'AIRCRAFT ' + ac.id + ' LOAD_FLIGHT_PLAN AC_ID ' + ac.id +
        ' VEL ' + vel +
        ' ' + MODE.sim_type +
        ' WP' + wp_string

    // send message to server
    C.sendFullMessage(message);

    // Update ac
    ac.status = 1;

    // show loading panel
    F.createInfoPanel(ac)
    F.setPanelInfo(ac, 'pre_flight_info_div_')
    F.createLoadingPanel('sendwaypoints', ac)
    F.makePanelActive('loading_sendwaypoints_' + ac.id)

    // redraw the flight plan (new dash width)
    M.DrawFlightPlan();
}

/**
 * @function <a name="clickSendStartFlight">clickSendStartFlight</a>
 * @description Sends start flight message, updates the map, then loads inflight panel.
 * @param none
 * @memberof module:eventFunctions
 */
export function clickSendStartFlight() {
    let ac = AM.getActiveAc()
    ac.status = 2;

    // send the message
    let message = 'AIRCRAFT ' + ac.id + ' FLIGHT_STARTED ' + ac.id + ' 0 ' + ac.icarous;
    C.sendFullMessage(message);

    // redraw the flight plan (new line dashes)
    M.DrawFlightPlan()

    // show the loading panel
    F.createInFlightPanel(ac)
    F.setPanelInfo(ac, 'flight_info_div_')
    F.createLoadingPanel('startflight', ac);
    F.makePanelActive('loading_startflight_' + ac.id);
}

export function clickSendStartIcarous() {
    let ac = AM.getActiveAc()
    ac.status = 2;

    // send the message
    let message = 'AIRCRAFT ' + ac.id + ' FLIGHT_STARTED ' + ac.id + ' 1 ' + ac.icarous;
    C.sendFullMessage(message);

    // redraw the flight plan (new line dashes)
    M.DrawFlightPlan()

    // show the loading panel
    F.createInFlightPanel(ac)
    F.setPanelInfo(ac, 'flight_info_div_')
    F.createLoadingPanel('startflight', ac);
    F.makePanelActive('loading_startflight_' + ac.id);
}

export function clickResetIcarous() {
    let ac = AM.getActiveAc()
    ac.status = 1
    let message = 'AIRCRAFT ' + ac.id + ' RESET_ICAROUS ' + ac.id
    C.sendFullMessage(message)
    F.makePanelActive('ac_info_pan_' + ac.id)
}


/**
 * @function <a name="sendStartFlight">sendStartFlight</a>
 * @description Sends start flight message, updates the map, then loads inflight panel.
 * @param ac {Object} Aircraft Object
 * @memberof module:eventFunctions
 */
export function sendStartFlight(ac) {
    ac.status = 2;

    // send the message
    let message = 'AIRCRAFT ' + ac.id + ' FLIGHT_STARTED ' + ac.id + ' 0 ' + ac.icarous;
    C.sendFullMessage(message);
    console.log(message)
    // redraw the flight plan (new line dashes)
    M.DrawFlightPlan()

    // show the loading panel
    F.createInFlightPanel(ac)
    F.setPanelInfo(ac, 'flight_info_div_')
    F.createLoadingPanel('startflight', ac);
    F.makePanelActive('loading_startflight_' + ac.id);
}


/**
 * @function <a name="clickEditFlightPlan">clickEditFlightPlan</a>
 * @description Sends an unused messages, then loads planning panel.
 * @param none
 * @memberof module:eventFunctions
 */
export function clickEditFlightPlan() {
    let ac = getACFromElementId(this.id);
    ac.status = 0;
    let message = 'NO_FLIGHT_PLAN_LOADED ' + ac.id;
    C.sendMessage(message);
    F.makePanelActive('ac_pan_' + ac.id);
}

/**
 * @function <a name="contextShutdown">clickContextShutdown</a>
 * @description Click wraper for acShutdown()
 * @param none
 * @memberof module:eventFunctions
 */
export function contextShutdownAc() {
    let ac = AM.getActiveAc()
    acShutdown(ac)
}

/**
 * @function <a name="clickShutdown">clickShutdown</a>
 * @description Click wraper for acShutdown()
 * @param none
 * @memberof module:eventFunctions
 */
export function clickShutdown() {
    let ac = getACFromElementId(this.id);
    acShutdown(ac)
}

/**
 * @function <a name="acShutdown">acShutdown</a>
 * @description Shuts down an aircraft, removes it from map and removes the panels.
 * @param ac {Object} Aircraft object.
 * @memberof module:Aircraft
 */
export function acShutdown(ac, originator = true) {
    setTimeout(console.log('Waiting for the queue to clear.'), 3000)

    let ac_list = AM.aircraft_list
    if (originator) {
        if (ac.mode == 'SITL' && ac_list.length > 0) {
            let message = 'AIRCRAFT ' + ac.id + ' SHUTDOWN ' + ac.id;
            C.sendFullMessage(message);
        } else if (ac.mode == 'HITL' && ac_list.length > 0) {
            let message = 'AIRCRAFT ' + ac.id + ' HITL_DISCONNECT ' + ac.id;
            C.sendFullMessage(message);
        } // playback - message already sent
    }
    // remove ac from menu
    let menu_li = document.getElementsByClassName('menu_li');
    for (let i = menu_li.length - 1; i >= 0; i--) {
        let id = menu_li[i].childNodes[0].childNodes[0].id.split('_')
        id = id[id.length - 1]
        if (id == ac.id) {
            menu_li[i].parentNode.removeChild(menu_li[i])
        }
    }

    // remove all markers and icons from map
    M.removeACShutdown(ac)

    // remove all indicators
    I.removeIndicators()

    // remove all panels associated with that ac
    let panels = document.getElementsByClassName('panel-body');
    for (let i = panels.length - 1; i >= 0; i--) {
        let id = panels[i].id.split('_');
        id = id[id.length - 1]
        if (id == ac.id) {
            panels[i].parentNode.removeChild(panels[i]);
        }
    }

    // remove ac from ac list
    AM.removeFromAircraftList(ac)

    // make settings panel active
    F.makePanelActive('settings');
}


/**
 * @function <a name="clickStopFlight">clickStopFlight</a>
 * @description Sends flight stopped message and makes post flight panel active. Incomplete at this time.
 * @todo need to implement rtl or land
 * @param none
 * @memberof module:eventFunctions
 */
export function clickStopFlight() {
    console.log('need to implement rtl or some sort of controlled landing.')
    // send message
    let ac = getACFromElementId(this.id);
    ac.status = 1; // needs to be 3
    let message = 'FLIGHT_STOPPED ' + ac.id;
    C.sendMessage(message);
    // TODO: create post flight panel
    F.makePanelActive('ac_info_pan_' + ac.id);
}

/**
 * @function <a name="clickTable">clickTable</a>
 * @description Highlights clicked row, allows for changing wp's when the map is clicked.
 * @param event click event
 * @memberof module:eventFunctions
 */
export function clickTable(event) {
    // remove highlight class from all
    F.removeHighlight()
    if (event.target.tagName == 'TD') {
        // add highlight to the selected row
        event.target.parentNode.classList.add('highlight');
    } else if (event.target.tagName == 'BUTTON') {
        let nothing = null;
    } else {
        // have to go up one node higher
        // add highlight to the selected row
        event.target.parentNode.parentNode.classList.add('highlight');
    }
}

/**
 * @function <a name="getACFromElementId">getACFromElementId</a>
 * @description helper function used to determine target aircraft.
 * @todo Refactor, Not really needed.
 * @param id {string} string that aircraft id can be derived from.
 * @memberof module:eventFunctions
 */
export function getACFromElementId(id) {
    id = id.split('_');
    id = id[id.length - 1]
    let ac = AM.getAircraftById(id);
    return (ac)
}


/**
 * @function <a name="clickAddRowButton">clickAddRowButton</a>
 * @description Click handler for row add button. Adds a row, updates ac, table and map.
 * @param none
 * @memberof module:eventFunctions
 */
export function clickAddRowButton() {
    // get active aircraft
    let ac = AM.getActiveAc();

    //create new wp and show on map
    let alt = ac.u_alt
    let center = M.getCenter();
    let newLatLng = new L.LatLng(center[0], center[1]);
    let wp = new W.Waypoint(newLatLng, alt);
    wp.wpMarker = M.defineWPMarker(center, ac.id);
    M.addMarkerToLayer(ac.id, wp.wpMarker)

    // update the ac
    ac.flightplan.push(wp);

    // update the table
    let table = document.getElementById('ac_fp_table_' + ac.id)
    F.updateTable(table, ac.id, 'fp', ac.flightplan.length - 1, clickAddRowButton, clickRemoveRowButton);

    // redraw the flight plan
    M.DrawFlightPlan();
}

/**
 * @function <a name="clickRemoveRowButton">clickRemoveRowButton</a>
 * @description Click handler for row remove button. Removes a row, updates ac, table and map.
 * @param none
 * @memberof module:eventFunctions
 */
export function clickRemoveRowButton() {
    let ac = AM.getActiveAc()
    M.RemoveRowAndWp(ac);
}

/**
 * @function <a name="inputUpdateWpAlt">inputUpdateWpAlt</a>
 * @description Input altitudes are added to the flight plan.
 * @param e {event} event
 * @memberof module:eventFunctions
 */
export function inputUpdateWpAlt(e) {
    let id = e.target.id.split('_')
    let ac = AM.getActiveAc()
    let wp_id = id[id.length - 1]
    let value = e.target.value
    let wp = ac.flightplan[parseInt(wp_id)]
    wp.alt = parseInt(value)
}

/**
 * @function <a name="inputUpdateUVelocity">inputUpdateUVelocity</a>
 * @description Input updates the user planned velocity.
 * @param e {event} event
 * @memberof module:eventFunctions
 */
export function inputUpdateUVelocity(e) {
    let ac = AM.getActiveAc()
    let value = e.target.value
    ac.u_vel = parseInt(value)
}

/**
 * @function <a name="changeModeSelection">changeModeSelection</a>
 * @description User selection changes the mode and updates the settings panel. Triggers alerts if not allowed or has an error.
 * @param e {event} event
 * @memberof module:eventFunctions
 */
export function changeModeSelection(e) {

    // clear all active processes
    // remove all ac
    let ac_list = AM.aircraft_list
    if (ac_list.length > 0) {
        F.alertBannerRed("Cannot change mode while aircraft are active. Please shut down all processes.")
        F.makePanelActive('ac_pan_' + ac_list[0].id)
        return
    }

    // change the mode
    if (e.target.value == 'SITL') {
        MODE.makeModeSITL()
    } else if (e.target.value == 'HITL') {
        MODE.makeModeHITL()
    } else if (e.target.value == 'Playback') {
        MODE.makeModePlayback()
    } else {
        F.alertBannerRed('This should not happen.', e.target.value)
    }

    // update the panel
    F.updateSettingsPanel()
    let x = {
        mode: MODE.mode
    }
    MODE.updateContextMenu(x)
    F.updateAcInMenu()
    setLocalStorage(e.target.value, 'mode')
}


/**
 * @function <a name="onInputSetMode">onInputSetMode</a>
 * @description Changes associated mode setting based on target id.
 * @param e {event} event
 * @memberof module:eventFunctions
 */
export function onInputSetMode(e) {
    let id = e.target.id.split('_')
    id = id[0]
    MODE[id] = e.target.value
    setLocalStorage(e.target.value, id)
}


export function onInputSetRadio(e) {
    let id = e.toElement.name
    MODE[id] = e.toElement.value
    setLocalStorage(e.toElement.value, id)
}


/**
 * @function <a name="highlightCurrentSettings">highlightCurrentSettings</a>
 * @description Highlight current mode settings toggle button.
 * @param e {event} event
 * @memberof module:eventFunctions
 */
export function highlightCurrentSettings() {
    // need to update the list as more options are added
    let name_list;
    if (MODE.mode == 'SITL') {
        name_list = [
            // 'serviceWorker_toggle',
            'adsb_toggle',
            'Tadsb_toggle',
            'multi_toggle',
            'sim_toggle',
            'sensor_toggle',
            // 'radar_toggle',
            'bands_toggle',
            'ring_toggle',
            'label_toggle',
            // 'alert_toggle',
            //'observeonly_toggle'
        ]
    } else if (MODE.mode == 'HITL') {
        name_list = [
            // 'serviceWorker_toggle',
            'adsb_toggle',
            // 'Tadsb_toggle',
            'sim_toggle',
            'sensor_toggle',
            // 'radar_toggle',
            'bands_toggle',
            'ring_toggle',
            'label_toggle',
            // 'alert_toggle',
            //'observeonly_toggle'
        ]
    } else if (MODE.mode == 'Playback') {
        name_list = [
            'adsb_toggle',
            'bands_toggle',
            'ring_toggle',
            'label_toggle',
            //'observeonly_toggle'
        ]
    } else {
        console.log('how did you get here?')
    }

    for (let i in name_list) {
        if (MODE[name_list[i].split('_')[0]]) {
            document.getElementById(name_list[i] + '_on').classList.add('highlight')
        } else {
            document.getElementById(name_list[i] + '_off').classList.add('highlight')
        }
    }
}

/**
 * @function <a name="clickToggleButton">clickToggleButton</a>
 * @description Update mode with new setting, refresh the panel and highlight new setting
 * @param name {string} Name of mode setting to be changed.
 * @memberof module:eventFunctions
 * @TODO rework this function
 */
export function clickToggleButton(name) {
    let here_ = false;
    let on = document.getElementById(name + '_on')
    let off = document.getElementById(name + '_off')

    on.classList.forEach(function (item) {
        if (item == 'highlight') {
            on.classList.remove('highlight');
            off.classList.add('highlight');
            MODE[name.split('_')[0]] = false;
            setLocalStorage('false', name.split('_')[0])
            here_ = true;
        }
    });

    if (here_) {
        return;
    };

    off.classList.forEach(function (item) {
        if (item == 'highlight') {
            off.classList.remove('highlight');
            on.classList.add('highlight');
            MODE[name.split('_')[0]] = true;
            setLocalStorage('true', name.split('_')[0])
        }
    });
}

/**
 * @function <a name="inputLatLng">inputLatLng</a>
 * @description Changes the center of the map to entered lat lng.
 * @todo don't call map.getCenter multiple times.
 * @param e {event} event
 * @memberof module:eventFunctions
 */
export function inputLatLng(e) {
    if (e.key == 'Enter') {
        // get the current value
        let lat = M.getCenter()[0]
        let lng = M.getCenter()[1]

        // get the input value
        let inputs = document.getElementsByClassName('in_latlng')
        for (let i of inputs) {
            let id = i.lastChild.id.split('_')
            id = id[id.length - 2]
            if (id == 'Lat:') {
                lat = parseFloat(i.lastChild.value)
            } else if (id == 'Lng:') {
                lng = parseFloat(i.lastChild.value)
            } else {
                console.log('There are no other options. This is a problem.')
            }
        }
        // update the center
        M.setCenter(lat, lng)

        // move the map
        M.moveMap(lat, lng)
    }

}

/**
 * @function <a name="enterLoadWp">enterLoadWp</a>
 * @description Sends message to load wp's from file when enter key is pressed.
 * @param e {event} event
 * @memberof module:eventFunctions
 */
export function enterLoadWp(e) {
    if (e.key == 'Enter') {
        C.sendMessage('LOAD_WP_FILE ' + e.srcElement.value)
    }
}

export function clickLoadWPFile(e) {
    let m
    let vel
    let lat
    let lng
    let alt
    let wp
    let wps = []
    let ac = AM.getActiveAc()
    let words

    // load the file
    let fr = new FileReader()

    fr.onload = function (e) {
        let text = fr.result
        let lines = text.split('\n')

        // add options for other file types
        if (!lines[0].includes('QGC WPL 110')) {
            console.log(lines[0])
            F.alertBannerRed('Invalid file format.')
            return
        }
        lines.splice(0, 1)
        for (let line of lines) {
            words = line.split('\t')
            if (words[3] == '22') {
                lat = words[8]
                lng = words[9]
                alt = words[10]
            } else if (words[3] == '16') {
                lat = words[8]
                lng = words[9]
                alt = words[10]
            } else if (words[3] == '178') {
                vel = words[5]
                lat = 0
                lng = 0
                alt = 0
            } else if (words[0] == '') {
                // pass, empty line
            } else {
                console.log(words)
                lat = 0
                lng = 0
                alt = 0
            }
            // need to be able to handle do jumps and a catch all for other entries
            if (words.length > 1) {
                wp = {
                    'SEQ': words[0],
                    'LAT': lat,
                    'LNG': lng,
                    'ALT': alt
                }
                wps.push(wp)
            }

        }

        m = {
            "AIRCRAFT": ac.id,
            "FILE": "true",
            "LIST": wps,
            "TYPE": "WP",
            "VEL": vel
        }
        wpInMessage(m, ac)

    }

    fr.readAsText(this.files[0])
    document.getElementById('wp_load' + ac.id + '_file_' + ac.id).value = ''

}

export function clickLoadPlaybackFile() {
    let fr = document.querySelector("#playback_file__file_set")
    let file = fr.files
    console.log(file[0].name)
    MODE.filename = file[0].name
    let n = document.getElementById('name_display')
    n.innerText = file[0].name
}



/**
 * @function <a name="enterSaveWp">enterSaveWp</a>
 * @description Saves wp's to file when enter key is pressed.
 * @param e {event} event
 * @memberof module:eventFunctions
 */
export function enterSaveWp(e) {
    if (e.key == 'Enter') {
        let ac = AM.getActiveAc()
        let filename = e.srcElement.value
        S.save_waypoints(ac, filename)
    }
}

/**
 * @function <a name="enterLoadParamsFile">enterLoadParamsFile</a>
 * @description Sends message to load params from file when enter key is pressed.
 * @param e {event} event
 * @memberof module:eventFunctions
 */
export function enterLoadParamsFile(e) {
    if (e.key == 'Enter') {
        let ac = AM.getActiveAc()
        let filename = '/Examples/Parameters/' + e.srcElement.value
        C.sendMessage('LOAD_PARAM_FILE ' + filename)

        // wait for a bit and let this happen
        setTimeout(console.log('waiting'), 2000)

        // reload params from aircraft
        C.sendMessage('UPDATE_PARAM_LIST')
    }
}

/**
 * @function <a name="enterLoadParamsFile">enterLoadParamsFile</a>
 * @description Sends message to load params from file when enter key is pressed.
 * @param e {event} event
 * @memberof module:eventFunctions
 */
export function enterSaveParam(e) {
    if (e.key == 'Enter') {
        let ac = AM.getActiveAc()
        let filename = e.srcElement.value
        S.save_parameters(ac, filename)
    }
}


export function updatePanels(ac) {
    // update all the panels
    let lable_list = document.getElementsByClassName('acName')
    for (let item of lable_list) {
        let p_id = item.parentNode.id.split('_')
        p_id = p_id[p_id.length - 1]
        if (p_id == ac.id) {
            item.innerHTML = ac.name
        }
    }
    // update the dropdown menu
    F.updateAcInMenu()
}


/**
 * @function <a name="sendConnectToAc">sendConnectToAc</a>
 * @description Sends HITL connect message. Pulls data from associated text inputs and radio buttons.
 * @param none
 * @memberof module:eventFunctions
 */
export function sendConnectToAc() {
    // check IP/USB radio buttons
    let rad = document.getElementsByClassName('radio_input_method')
    let dev
    for (let item of rad) {
        if (item.value == 'IP' && item.checked) {
            dev = document.getElementById('HITLipAddress_input').value
            let port = document.getElementById('port_input').value
            let baud = document.getElementById('baud_input').value
            let comp = document.getElementById('component_input').value
            let name = AM.aircraft_list.length + 1
            let msg = 'AIRCRAFT None HITL ' + name + ' BAUD ' + baud + ' IP ' + dev + ' PORT ' + port + ' COMP ' + comp
            C.sendFullMessage(msg)
            createNewAircraftHITL()
        } else if (item.value == 'USB' && item.checked) {
            dev = document.getElementById('usbport_input').value
            let port = document.getElementById('port_input').value
            let baud = document.getElementById('baud_input').value
            let comp = document.getElementById('component_input').value
            let name = AM.aircraft_list.length + 1
            let msg = 'AIRCRAFT None HITL ' + name + ' BAUD ' + baud + ' USB ' + dev + ' PORT ' + port + ' COMP ' + comp
            C.sendFullMessage(msg)
            C.sendFullMessage(msg)
            createNewAircraftHITL()
        }
    }

}


/**
 * @function <a name="sendDisconnectFromAc">sendDisconnectFromAc</a>
 * @description Sends message to disconnect from aircraft and deletes it from the front end.
 * @param none
 * @memberof module:eventFunctions
 */
export function sendDisconnectFromAc() {
    let ac = AM.getActiveAc()
    acShutdown(ac)
}

/**
 * @function <a name="setPathToIcarous">setPathToIcarous</a>
 * @description Saves the path to Icarous in MODE.
 * @param e {event} event
 * @memberof module:eventFunctions
 */
export function setPathToIcarous(e) {
    if (e.key == 'Enter') {
        MODE.ic_path = e.srcElement.value
        C.sendFullMessage('CHECK_PATH ' + MODE.ic_path)
        setLocalStorage(MODE.ic_path, 'ic_path')
    }
}

/**
 * @function <a name="setPathToArdupilot">setPathToArdupilot</a>
 * @description Saves the path to Ardupilot in MODE.
 * @param e {event} event
 * @memberof module:eventFunctions
 */
export function setPathToArdupilot(e) {
    if (e.key == 'Enter') {
        MODE.ardu_path = e.srcElement.value
        F.alertBannerGreen("ArduPilot path set to: " + MODE.ardu_path)
        setLocalStorage(MODE.ardu_path, 'ardu_path')
    }
}

export function setSimType(e) {
    if (e.key == 'Enter') {
        MODE.sim_type = e.srcElement.value
        F.alertBannerGreen("Sim type set to: " + MODE.sim_type)
        setLocalStorage(MODE.sim_type, 'sim_type')
    }
}

/**
 * @function <a name="clickOpenDAADisplay">clickOpenDAADisplay</a>
 * @description Opens DAA Display in new tab/window (result is based on browser settings, cannot be controled by javascript)
 * @param none
 * @memberof module:eventFunctions
 */
export function clickOpenDAADisplay() {
    let url = MODE.protocol + '//' + MODE.ipAddress + ':8082/apps/DAA/index.html'
    window.open(url, '_blank')
}

export function clickOpenGraphDisplay() {
    let url = MODE.protocol + '//' + MODE.ipAddress + ':8082/apps/Graphing/graph.html'
    window.open(url, '_blank')
}

export function clickOpenBatchDisplay() {
    let url = MODE.protocol + '//' + MODE.ipAddress + ':8082/apps/batch_sim/batch.html'
    window.open(url, '_blank')
}


/**
 * @function <a name="clickForwardData">clickForwardData</a>
 * @description Opens sub-panel with forwarding settings.
 * @param none
 * @memberof module:eventFunctions
 */
export function clickForwardData() {
    let ac = AM.getActiveAc()

    // check if the panel exists
    if (!document.getElementById('forwarding_' + ac.id)) {
        F.createForwardingSubPanel()
    }
    let pan_id = 'forwarding_' + ac.id
    //check if it is already active
    if (!ac.activeSubPanels.includes(pan_id)) {
        ac.activeSubPanels.push(pan_id)
    }
    F.updateForwardingSubPanel()
    F.makePanelActive('ac_' + ac.prev_panel + '_' + ac.id)
}

/**
 * @function <a name="submitForwardData">submitForwardData</a>
 * @description Sends message to forward data to input ip and port at specified rate, and updates the aircraft object with this info.
 * @param none
 * @memberof module:eventFunctions
 */
export function submitForwardData() {
    let ac = AM.getActiveAc()
    // get values
    let ip = document.getElementById('forward_ip_' + ac.id + '_input').value
    let port = document.getElementById('forward_port_' + ac.id + '_input').value
    let baud = document.getElementById('forward_baud_' + ac.id + '_input').value
    // set ac values
    ac.f_ip = ip
    ac.f_port = port
    ac.f_baud = baud
    ac.forwarding = true
    // send the message

    C.sendFullMessage('AIRCRAFT ' + ac.id + ' FORWARD ' + ip + ' ' + port + ' ' + baud)
    // change the panel to summary
    F.updateForwardingSubPanel()
}


export function scriptForwardData(name, ip, port, baud) {
    let ac = AM.getAircraftByName(name)
    ac.f_ip = ip
    ac.f_port = port
    ac.f_baud = baud
    ac.forwarding = true
    // send the message

    C.sendFullMessage('AIRCRAFT ' + ac.id + ' FORWARD ' + ip + ' ' + port + ' ' + baud)
}

/**
 * @function <a name="hideForwardData">hideForwardData</a>
 * @description Hides the forward data subpanel
 * @param none
 * @memberof module:eventFunctions
 */
export function hideForwardData() {
    let ac = AM.getActiveAc()
    for (let item of ac.activeSubPanels) {
        if (item.includes('forwarding')) {
            ac.activeSubPanels.splice(ac.activeSubPanels.indexOf(item), 1)
        }
    }
    F.makePanelActive('ac_' + ac.prev_panel + '_' + ac.id)
}


/**
 * @function <a name="removeForwardData">removeForwardData</a>
 * @description Sends message to stop forwarding data and hides the panel.
 * @param none
 * @memberof module:eventFunctions
 */
export function removeForwardData() {
    let ac = AM.getActiveAc()
    ac.forwarding = false
    C.sendFullMessage('AIRCRAFT ' + ac.id + ' FORWARD STOP')
    hideForwardData()
}


/**
 * @function <a name="sendStartPlayback">sendStartPlayback</a>
 * @description Sends message to start playback, and creates the menu. Or, alerts user that playback is already running.
 * @param none
 * @memberof module:eventFunctions
 */
export function sendStartPlayback() {
    let menu = document.getElementById('playbackMenu')
    if (!menu) {

        C.sendFullMessage('AIRCRAFT None PLAYBACK START ' + MODE.filename)
        // show playback button menu
        P.createPlaybackMenu()
    } else {
        F.alertBannerRed('Playback already running. Press Stop to play a new file.')
    }
}

/**
 * @function <a name="sendPlayPlayback">sendPlayPlayback</a>
 * @description Sends play message to server.
 * @param none
 * @memberof module:eventFunctions
 */
export function sendPlayPlayback() {
    C.sendFullMessage('AIRCRAFT None PLAYBACK PLAY')
}

/**
 * @function <a name="sendStopPlayback">sendStopPlayback</a>
 * @description Sends stop message to server. Removes all aircraft and the playback menu.
 * @param none
 * @memberof module:eventFunctions
 */
export function sendStopPlayback() {
    // has to be the same as ac shutdown, need to remove everything
    C.sendFullMessage('AIRCRAFT -1 SHUTDOWN -1 PLAYBACK')
    MODE.playerActive = false
    // check mode
    for (let ac of AM.aircraft_list) {
        acShutdown(ac)
    }
    // remove playback controls
    let menu = document.getElementById('playbackMenu')
    if (menu) {
        menu.parentElement.removeChild(menu)
    }
}

/**
 * @function <a name="sendRewPlayback">sendRewPlayback</a>
 * @description Sends rewind message to server.
 * @param none
 * @memberof module:eventFunctions
 */
export function sendRewPlayback() {
    C.sendFullMessage('AIRCRAFT None PLAYBACK REW')
}

/**
 * @function <a name="sendFFPlayback">sendFFPlayback</a>
 * @description Sends fast forward message to server.
 * @param none
 * @memberof module:eventFunctions
 */
export function sendFFPlayback() {
    C.sendFullMessage('AIRCRAFT None PLAYBACK FF')
}

/**
 * @function <a name="sendSkipPlayback">sendSkipPlayback</a>
 * @description Sends skip message to server.
 * @param none
 * @memberof module:eventFunctions
 */
export function sendSkipPlayback() {
    let skipDistance = 30
    C.sendFullMessage('AIRCRAFT None PLAYBACK SKIP ' + skipDistance)
}



// These can be removed before release
export function clickTurnRadarOn() {
    C.sendMessage('RADAR 1')
}

export function clickTurnRadarOff() {
    C.sendMessage('RADAR 0')
}


export function testFunction() {
    console.log('Test Button Pressed')
    let ac = AM.getActiveAc()
    console.log(ac.icon)
}


export function refreshDisplayAll() {
    for (let ac of AM.aircraft_list) {
        C.sendFullMessage('AIRCRAFT ' + ac.id + ' REQUEST_WAYPOINTS ' + ac.id);
        C.sendFullMessage('AIRCRAFT ' + ac.id + ' REQUEST_FENCE ' + ac.id)
        C.sendFullMessage('AIRCRAFT ' + ac.id + ' REQUEST_REPLAN ' + ac.id)
        C.sendFullMessage('AIRCRAFT ' + ac.id + ' UPDATE_PARAM_LIST')
    }
}

export function refreshDisplay(ac) {
    C.sendFullMessage('AIRCRAFT ' + ac.id + ' REQUEST_WAYPOINTS ' + ac.id);
    C.sendFullMessage('AIRCRAFT ' + ac.id + ' REQUEST_FENCE ' + ac.id)
    C.sendFullMessage('AIRCRAFT ' + ac.id + ' REQUEST_REPLAN ' + ac.id)
    C.sendFullMessage('AIRCRAFT ' + ac.id + ' UPDATE_PARAM_LIST')
}


export function wpInMessage(m, ac) {
    // console.log(m)
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
        M.removeMarkerFromLayer(ac.id, item.wpMarker)
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
            wp = new W.Waypoint(newLatLng, item.ALT);

            // add a marker
            wp.wpMarker = M.defineWPMarker(newLatLng, ac.id);
            M.addMarkerToLayer(ac.id, wp.wpMarker)

            // update the flight plan
            ac.flightplan[count] = wp;
            if (ac.status < 2) {
                // add new row for wp
                F.updateTable(table, ac.id, 'fp', count, clickAddRowButton, clickRemoveRowButton)

                // update row values
                M.setRowValue(ac.id, 'fp', count, item.LAT, item.LNG, item.ALT)
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
    F.makePanelActive('ac_pan_' + ac.id)

    // Re draw the flight plan
    M.DrawFlightPlan();
}

/**
 * @function <a name="createAircraft">createAircraft</a>
 * @description Creates new Aircraft, adds panels, and adds icons to map
 * @param id {string} Aircraft Id
 * @param mode {string} Recieved flight mode
 * @memberof module:comms
 */
export function createAircraft(id, mode) {
    let fp = [];
    let ac = new A.Aircraft(id, AM.aircraft_list, fp);
    let center = M.getCenter()
    ac.lat = center[0]
    ac.lng = center[1]
    ac.status = 0;
    ac.hasComms = true;
    ac.commsLast = Date.now() / 1000
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
    AM.aircraft_list.push(ac);
    // add to drop down list
    F.updateAcInMenu()
    // create panels
    F.createFlightPlanPanel(ac);
    F.createLoadingPanel('startup', ac)
    F.makePanelActive('ac_pan_' + ac.id)

    // check for loaded wp's, fences, replan and params
    refreshDisplay(ac)

    // draw the marker - keep this after request wp's
    // has issues auto drawing all of the flight plans
    // will hide any created after the initial ac sometimes
    M.addNewLayerGroup(ac);

    console.log('created ac ' + ac.id, ac)
    return ac
}