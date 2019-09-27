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



import * as comms from './comms.js';
import * as Aircraft from './aircraft.js';
import * as map from './map.js';
import * as form from './form.js';
import * as mode from './gcsmode.js';
import * as save from '../FlyByFile/saveFile.js';
import * as IC from '../MainJS/icSettings.js';
import * as user from '../MainJS/updateUser.js';
import * as P from '../MainJS/playback.js'



let MODE = new mode.GCSmode();


/**
 * @function <a name="getMode">getMode</a>
 * @description Returns the mode settings object for this instance of webgs.
 * @param none
 * @todo move this to a better location. also, could just export the variable MODE and remove the function.
 * @return {Object} Current Mode.
 * @memberof module:eventFunctions
 */
export function getMode() {
    return MODE;
}

// add event listeners to the window and menu buttons
window.addEventListener('load', loadBody);
window.addEventListener('unload', unloadBody)
document.getElementById('summary').addEventListener('click', clickSummary);
document.getElementById('filechoice').addEventListener('change', clickLoadFile);
document.getElementById('settings_btn').addEventListener('click', clickSettings);
document.getElementById('reload_btn').addEventListener('click', refreshDisplay)
window.addEventListener('resize', form.adjustFormSize)


/**
 * @function <a name="loadBody">loadBody</a>
 * @description Sets up initial display on page load.
 * @param none
 * @memberof module:eventFunctions
 */
export function loadBody() {
    // register service worker
    if (MODE.swToggle == 'On') {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/serviceWorker.js')
                .then(function () {
                    console.log('Service Worker Registered');
                });
        }
    }
    // mode specific settings
    if (MODE.mode == 'SITL') {
        // Add new aircraft button
        form.updateAcInMenu(false)
    } else if (MODE.mode == 'HITL') {
        // Add new aircraft button
        form.updateAcInMenu(false)
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

    // connect with socket server
    comms.createConnection('0.0.0.0', '8000')

    // display the current status
    form.setSummaryPanelInfo()

    // start on the settings page
    form.createSettingsPanel()
    form.makePanelActive('settings')

    setTimeout(function () {
        // check path to icarous
        comms.sendFullMessage('CHECK_PATH ' + MODE.path)
        // check path to ardupilot
        comms.sendFullMessage('CHECK_PATH_A ' + MODE.ardu_path)
    }, 2000)


}

/**
 * @function <a name="unloadBody">unloadBody</a>
 * @description Close or refresh page functions.
 * @param none
 * @memberof module:eventFunctions
 */
export function unloadBody() {
    user.updateUserSettingsFile()
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
    let ac_list = comms.getAircraftList();
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
    let ac = new Aircraft.Aircraft(ac_id, ac_list, fp);
    ac.icarous = ic
    if (center == null) {
        try {
            ac.lat = e.latlng.lat
            ac.lng = e.latlng.lng
        } catch {
            center = map.getCenter()
            ac.lat = center[0]
            ac.lng = center[1]
        }
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
    comms.pushToAircraftList(ac);

    if (mode != 'HITL') {
        // let the server know a new aircraft has been created
        let out_message = 'AIRCRAFT ' + ac.id + ' NEW_AIRCRAFT ' +
            ac.id + ' ' +
            ac.lat + ' ' +
            ac.lng + ' ' +
            ac.alt + ' ' +
            ac.hdg + ' ' +
            ac.type + ' ' +
            ac.icarous + ' ' +
            MODE.sim_type + ' ' +
            MODE.path + ' ' +
            MODE.ardu_path;
        comms.sendFullMessage(out_message);
    }

    // add a button to the menu
    form.updateAcInMenu()

    // build the panel and wait for heartbeat to make it active
    form.createFlightPlanPanel(ac);
    form.createLoadingPanel('startup', ac)
    form.makePanelActive('loading_startup_' + ac.id)

    // check for loaded wp's
    comms.sendMessage('REQUEST_WAYPOINTS ' + ac.id);
    comms.sendMessage('REQUEST_FENCE ' + ac.id)
    comms.sendMessage('REQUEST_REPLAN ' + ac.id)


    // add a layer to the map
    map.addNewLayerGroup(ac);
}

/**
 * @function <a name="clickSummary">clickSummary</a>
 * @description Click handler that opens the summary panel.
 * @param none
 * @memberof module:eventFunctions
 */
export function clickSummary(e) {
    form.setSummaryPanelInfo();
    form.makePanelActive('blank');
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
    form.createSettingsPanel();
    form.makePanelActive('settings')
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
        console.log(fr)
        console.log(this.files[0])


        // remove any old panel for this file
        let old = document.getElementById('file_load_' + file_name);
        if (old != null) {
            old.parentNode.removeChild(old);
        }

        // create and make new panel active
        form.createFilePanel('file_load_' + file_name);

        fr.onload = function (e) {
            console.log(fr.result)
            document.getElementById('contents_' + file_name).textContent = fr.result;
        };
        fr.readAsText(this.files[0]);

        form.makePanelActive('file_load_' + file_name);
    } else {
        form.alertBannerRed('Fly By File only works in SITL Mode')
    }
}

// todo: get rid of this use clickSettings
export function clickCancel() {
    // go back to start page
    form.makePanelActive('settings');
}

/**
 * @function <a name="clickACPanelShow">clickACPanelShow</a>
 * @description Click handler that opens an aircraft panel.
 * @param none
 * @memberof module:eventFunctions
 */
export function clickACPanelShow() {
    let ac = getACFromElementId(this.id)
    form.makePanelActive('ac_pan_' + ac.id);
}

/**
 * @function <a name="clickChangeParameters">clickChangeParameters</a>
 * @description Click handler that opens the parameter panel.
 * @param none
 * @memberof module:eventFunctions
 */
export function clickChangeParameters() {
    let ac = getACFromElementId(this.id);
    comms.sendMessage('UPDATE_PARAM_LIST')

    // create loading panel
    form.createLoadingPanel('paramupdate', ac)
    // make panel active
    form.makePanelActive('loading_paramupdate_' + ac.id)
    setTimeout(function () {
        console.log('Getting Parameters')
        form.updateParamPanel(ac)
        form.makePanelActive('ac_param_pan_' + ac.id)
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
                    comms.sendMessage(message);
                } else {
                    console.log('Change param canceled')
                }
            }
        }
    }

    // go back to building flight plan
    form.makePanelActive('ac_pan_' + ac.id);
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
    comms.sendMessage(message)

    setTimeout(function () {
        form.updateParamPanel(ac)
        form.alertBannerGreen('Updated Param List')
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
    form.makePanelActive('ac_pan_' + ac.id);
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

    let wp_string = Aircraft.flightplanToString(ac)

    let message = 'LOAD_FLIGHT_PLAN AC_ID ' + ac.id +
        ' VEL ' + ac.u_vel +
        ' WP' + wp_string

    // send message to server
    comms.sendMessage(message);

    // Update ac
    ac.status = 1;

    // show loading panel
    form.createInfoPanel(ac)
    form.setPanelInfo(ac, 'pre_flight_info_div_')
    form.createLoadingPanel('sendwaypoints', ac)
    form.makePanelActive('loading_sendwaypoints_' + ac.id)

    // redraw the flight plan
    map.DrawFlightPlan();
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
        ' WP' + wp_string

    // send message to server
    comms.sendFullMessage(message);

    // Update ac
    ac.status = 1;

    // show loading panel
    form.createInfoPanel(ac)
    form.setPanelInfo(ac, 'pre_flight_info_div_')
    form.createLoadingPanel('sendwaypoints', ac)
    form.makePanelActive('loading_sendwaypoints_' + ac.id)

    // redraw the flight plan (new dash width)
    map.DrawFlightPlan();
}

/**
 * @function <a name="clickSendStartFlight">clickSendStartFlight</a>
 * @description Sends start flight message, updates the map, then loads inflight panel.
 * @param none
 * @memberof module:eventFunctions
 */
export function clickSendStartFlight() {
    let ac = Aircraft.getActiveAc()
    ac.status = 2;

    // send the message
    let message = 'AIRCRAFT ' + ac.id + ' FLIGHT_STARTED ' + ac.id + ' 0 ' + ac.icarous;
    comms.sendFullMessage(message);

    // redraw the flight plan (new line dashes)
    map.DrawFlightPlan()

    // show the loading panel
    form.createInFlightPanel(ac)
    form.setPanelInfo(ac, 'flight_info_div_')
    form.createLoadingPanel('startflight', ac);
    form.makePanelActive('loading_startflight_' + ac.id);
}

export function clickSendStartIcarous() {
    let ac = Aircraft.getActiveAc()
    ac.status = 2;

    // send the message
    let message = 'AIRCRAFT ' + ac.id + ' FLIGHT_STARTED ' + ac.id + ' 1 ' + ac.icarous;
    comms.sendFullMessage(message);

    // redraw the flight plan (new line dashes)
    map.DrawFlightPlan()

    // show the loading panel
    form.createInFlightPanel(ac)
    form.setPanelInfo(ac, 'flight_info_div_')
    form.createLoadingPanel('startflight', ac);
    form.makePanelActive('loading_startflight_' + ac.id);
}

export function clickResetIcarous() {
    let ac = Aircraft.getActiveAc()
    ac.status = 1
    let message = 'AIRCRAFT ' + ac.id + ' RESET_ICAROUS ' + ac.id
    comms.sendFullMessage(message)
    form.makePanelActive('ac_info_pan_' + ac.id)
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
    comms.sendFullMessage(message);

    // redraw the flight plan (new line dashes)
    map.DrawFlightPlan()

    // show the loading panel
    form.createInFlightPanel(ac)
    form.setPanelInfo(ac, 'flight_info_div_')
    form.createLoadingPanel('startflight', ac);
    form.makePanelActive('loading_startflight_' + ac.id);
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
    comms.sendMessage(message);
    form.makePanelActive('ac_pan_' + ac.id);
}

/**
 * @function <a name="contextShutdown">clickContextShutdown</a>
 * @description Click wraper for Aircraft.acShutdown()
 * @param none
 * @memberof module:eventFunctions
 */
export function contextShutdownAc() {
    let ac = Aircraft.getActiveAc()
    Aircraft.acShutdown(ac)
}

/**
 * @function <a name="clickShutdown">clickShutdown</a>
 * @description Click wraper for Aircraft.acShutdown()
 * @param none
 * @memberof module:eventFunctions
 */
export function clickShutdown() {
    let ac = getACFromElementId(this.id);
    Aircraft.acShutdown(ac)
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
    comms.sendMessage(message);
    // TODO: create post flight panel
    form.makePanelActive('ac_info_pan_' + ac.id);
}

/**
 * @function <a name="clickTable">clickTable</a>
 * @description Highlights clicked row, allows for changing wp's when the map is clicked.
 * @param event click event
 * @memberof module:eventFunctions
 */
export function clickTable(event) {
    // remove highlight class from all
    form.removeHighlight()
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
    let ac = Aircraft.getAircraftById(id);
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
    let ac = Aircraft.getActiveAc();

    //create new wp and show on map
    let alt = ac.u_alt
    let center = map.getCenter();
    let newLatLng = new L.LatLng(center[0], center[1]);
    let wp = new Aircraft.Waypoint(newLatLng, alt);
    wp.wpMarker = map.defineWPMarker(center, ac.id);
    map.addMarkerToLayer(ac.id, wp.wpMarker)

    // update the ac
    ac.flightplan.push(wp);

    // update the table
    let table = document.getElementById('ac_fp_table_' + ac.id)
    form.updateTable(table, ac.id, 'fp', ac.flightplan.length - 1, clickAddRowButton, clickRemoveRowButton);

    // redraw the flight plan
    map.DrawFlightPlan();
}

/**
 * @function <a name="clickRemoveRowButton">clickRemoveRowButton</a>
 * @description Click handler for row remove button. Removes a row, updates ac, table and map.
 * @param none
 * @memberof module:eventFunctions
 */
export function clickRemoveRowButton() {
    let ac = Aircraft.getActiveAc()
    map.RemoveRowAndWp(ac);
}

/**
 * @function <a name="inputUpdateWpAlt">inputUpdateWpAlt</a>
 * @description Input altitudes are added to the flight plan.
 * @param e {event} event
 * @memberof module:eventFunctions
 */
export function inputUpdateWpAlt(e) {
    let id = e.target.id.split('_')
    let ac = Aircraft.getActiveAc()
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
    let ac = Aircraft.getActiveAc()
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
    let ac_list = comms.getAircraftList()
    if (ac_list.length > 0) {
        form.alertBannerRed("Cannot change mode while aircraft are active. Please shut down all processes.")
        form.makePanelActive('ac_pan_' + ac_list[0].id)
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
        form.alertBannerRed('This should not happen.', e.target.value)
    }

    // update the panel
    form.updateSettingsPanel()
    let x = {
        mode: MODE.mode
    }
    MODE.updateContextMenu(x)
    form.updateAcInMenu()
}

/**
 * @function <a name="saveSettings">saveSettings</a>
 * @description Save user settings based on curent mode.
 * @memberof module:eventFunctions
 */
export function saveSettings() {
    console.log('Saving User Settings')
    user.updateUserSettingsFile()
}

/**
 * @function <a name="clickResetSettings">clickResetSettings</a>
 * @description Resets settings to default and saves file.
 * @memberof module:eventFunctions
 */
export function clickResetSettings() {
    comms.sendMessage('RESET_USER_SETTINGS')
}

/**
 * @function <a name="onInputSetMode">onInputSetMode</a>
 * @description Changes associated mode setting based on target id.
 * @param e {event} event
 * @memberof module:eventFunctions
 */
export function onInputSetMode(e) {
    if (e.key == 'Enter') {
        let id = e.target.id.split('_')
        id = id[0]
        MODE[id] = e.target.value
    }
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
            'serviceWorker_toggle',
            'adsb_toggle',
            'multi_toggle',
            'sim_toggle',
            'sensor_toggle',
            // 'radar_toggle',
            'bands_toggle',
            // 'alert_toggle',
            //'observeonly_toggle'
        ]
    } else if (MODE.mode == 'HITL') {
        name_list = [
            'serviceWorker_toggle',
            'adsb_toggle',
            'sim_toggle',
            'sensor_toggle',
            // 'radar_toggle',
            'bands_toggle',
            // 'alert_toggle',
            //'observeonly_toggle'
        ]
    } else if (MODE.mode == 'Playback') {
        name_list = [
            'adsb_toggle',
            'bands_toggle',
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
        let lat = map.getCenter()[0]
        let lng = map.getCenter()[1]

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
        map.setCenter(lat, lng)

        // move the map
        map.moveMap(lat, lng)
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
        comms.sendMessage('LOAD_WP_FILE ' + e.srcElement.value)
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
    let ac = Aircraft.getActiveAc()
    let words

    // load the file
    let fr = new FileReader()

    fr.onload = function (e) {
        let text = fr.result
        let lines = text.split('\n')

        // add options for other file types
        if (lines[0] != 'QGC WPL 110') {
            form.alertBannerRed('Invalid file format.')
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
            } else {
                console.log(words)
                lat = 0
                lng = 0
                alt = 0
            }
            // need to be able to handle do jumps and a catch all for other entries

            wp = {
                'SEQ': words[0],
                'LAT': lat,
                'LNG': lng,
                'ALT': alt
            }
            wps.push(wp)

        }

        m = {
            "AIRCRAFT": ac.id,
            "FILE": "true",
            "LIST": wps,
            "TYPE": "WP",
            "VEL": vel
        }
        comms.wpInMessage(m, ac)

    }

    fr.readAsText(this.files[0])
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
        let ac = Aircraft.getActiveAc()
        let filename = e.srcElement.value
        save.save_waypoints(ac, filename)
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
        let ac = Aircraft.getActiveAc()
        let filename = '/Examples/Parameters/' + e.srcElement.value
        comms.sendMessage('LOAD_PARAM_FILE ' + filename)

        // wait for a bit and let this happen
        setTimeout(console.log('waiting'), 2000)

        // reload params from aircraft
        comms.sendMessage('UPDATE_PARAM_LIST')
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
        let ac = Aircraft.getActiveAc()
        let filename = e.srcElement.value
        save.save_parameters(ac, filename)
    }
}

/**
 * @function <a name="inputAcName">inputAcName</a>
 * @description Changes Aircraft name when enter key is pressed.
 * @param e {event} event
 * @memberof module:eventFunctions
 */
export function inputAcName(e) {
    // change the name of the aircraft when enter is pressed in the name textbox
    if (e.key == 'Enter') {
        // get the input value
        let input = document.getElementById(e.path[0].id)
        let name = input.value
        let id_list = e.path[2].id.split('_')
        let id = id_list[id_list.length - 1]
        let ac = Aircraft.getAircraftById(id)

        // set the ac name
        ac.name = name

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
        form.updateAcInMenu()
    }
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
            dev = document.getElementById('ipAddress_input').value
            let port = document.getElementById('port_input').value
            let baud = document.getElementById('baud_input').value
            let name = comms.getAircraftList().length + 1
            let msg = 'AIRCRAFT None HITL ' + name + ' BAUD ' + baud + ' IP ' + dev + ' PORT ' + port
            comms.sendFullMessage(msg)
            createNewAircraftHITL()
        } else if (item.value == 'USB' && item.checked) {
            dev = document.getElementById('usbport_input').value
            let port = document.getElementById('port_input').value
            let baud = document.getElementById('baud_input').value
            let name = comms.getAircraftList().length + 1
            let msg = 'AIRCRAFT None HITL ' + name + ' BAUD ' + baud + ' USB ' + dev + ' PORT ' + port
            comms.sendFullMessage(msg)
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
    let ac = Aircraft.getActiveAc()
    Aircraft.acShutdown(ac)
}

/**
 * @function <a name="setPathToIcarous">setPathToIcarous</a>
 * @description Saves the path to Icarous in MODE.
 * @param e {event} event
 * @memberof module:eventFunctions
 */
export function setPathToIcarous(e) {
    if (e.key == 'Enter') {
        // get the input value
        let path = e.srcElement.value
        MODE.path = path

        // check icarous path
        comms.sendFullMessage('CHECK_PATH ' + path)

        // form.alertBannerGreen("Icarous path set to: " + MODE.path)

        // check current settings
        let icApps = IC.getIcApps()
        icApps.getApps()
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
        // get the input value
        let path = e.srcElement.value
        MODE.ardu_path = path
        form.alertBannerGreen("ArduPilot path set to: " + MODE.ardu_path)
    }
}

/**
 * @function <a name="clickOpenDAADisplay">clickOpenDAADisplay</a>
 * @description Opens DAA Display in new tab/window (result is based on browser settings, cannot be controled by javascript)
 * @param none
 * @memberof module:eventFunctions
 */
export function clickOpenDAADisplay() {
    let url = 'http://' + MODE.ipAddress + ':8082/daa.html'
    window.open(url, '_blank')
}

/**
 * @function <a name="clickForwardData">clickForwardData</a>
 * @description Opens sub-panel with forwarding settings.
 * @param none
 * @memberof module:eventFunctions
 */
export function clickForwardData() {
    let ac = Aircraft.getActiveAc()

    // check if the panel exists
    if (!document.getElementById('forwarding_' + ac.id)) {
        form.createForwardingSubPanel()
    }
    let pan_id = 'forwarding_' + ac.id
    //check if it is already active
    if (!ac.activeSubPanels.includes(pan_id)) {
        ac.activeSubPanels.push(pan_id)
    }
    form.updateForwardingSubPanel()
    form.makePanelActive('ac_' + ac.prev_panel + '_' + ac.id)
}

/**
 * @function <a name="submitForwardData">submitForwardData</a>
 * @description Sends message to forward data to input ip and port at specified rate, and updates the aircraft object with this info.
 * @param none
 * @memberof module:eventFunctions
 */
export function submitForwardData() {
    let ac = Aircraft.getActiveAc()
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

    comms.sendFullMessage('AIRCRAFT ' + ac.id + ' FORWARD ' + ip + ' ' + port + ' ' + baud)
    // change the panel to summary
    form.updateForwardingSubPanel()
}


export function scriptForwardData(name, ip, port, baud) {
    let ac = Aircraft.getAircraftByName(name)
    ac.f_ip = ip
    ac.f_port = port
    ac.f_baud = baud
    ac.forwarding = true
    // send the message

    comms.sendFullMessage('AIRCRAFT ' + ac.id + ' FORWARD ' + ip + ' ' + port + ' ' + baud)
}

/**
 * @function <a name="hideForwardData">hideForwardData</a>
 * @description Hides the forward data subpanel
 * @param none
 * @memberof module:eventFunctions
 */
export function hideForwardData() {
    let ac = Aircraft.getActiveAc()
    for (let item of ac.activeSubPanels) {
        if (item.includes('forwarding')) {
            ac.activeSubPanels.splice(ac.activeSubPanels.indexOf(item), 1)
        }
    }
    form.makePanelActive('ac_' + ac.prev_panel + '_' + ac.id)
}


/**
 * @function <a name="removeForwardData">removeForwardData</a>
 * @description Sends message to stop forwarding data and hides the panel.
 * @param none
 * @memberof module:eventFunctions
 */
export function removeForwardData() {
    let ac = Aircraft.getActiveAc()
    ac.forwarding = false
    comms.sendFullMessage('AIRCRAFT ' + ac.id + ' FORWARD STOP')
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

        comms.sendFullMessage('AIRCRAFT None PLAYBACK START ' + MODE.filename)
        // show playback button menu
        P.createPlaybackMenu()
    } else {
        form.alertBannerRed('Playback already running. Press Stop to play a new file.')
    }
}

/**
 * @function <a name="sendPlayPlayback">sendPlayPlayback</a>
 * @description Sends play message to server.
 * @param none
 * @memberof module:eventFunctions
 */
export function sendPlayPlayback() {
    comms.sendFullMessage('AIRCRAFT None PLAYBACK PLAY')
}

/**
 * @function <a name="sendStopPlayback">sendStopPlayback</a>
 * @description Sends stop message to server. Removes all aircraft and the playback menu.
 * @param none
 * @memberof module:eventFunctions
 */
export function sendStopPlayback() {
    // has to be the same as ac shutdown, need to remove everything
    comms.sendFullMessage('AIRCRAFT -1 SHUTDOWN -1 PLAYBACK')
    MODE.playerActive = false
    // check mode
    for (let ac of comms.getAircraftList()) {
        Aircraft.acShutdown(ac)
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
    comms.sendFullMessage('AIRCRAFT None PLAYBACK REW')
}

/**
 * @function <a name="sendFFPlayback">sendFFPlayback</a>
 * @description Sends fast forward message to server.
 * @param none
 * @memberof module:eventFunctions
 */
export function sendFFPlayback() {
    comms.sendFullMessage('AIRCRAFT None PLAYBACK FF')
}

/**
 * @function <a name="sendSkipPlayback">sendSkipPlayback</a>
 * @description Sends skip message to server.
 * @param none
 * @memberof module:eventFunctions
 */
export function sendSkipPlayback() {
    let skipDistance = 30
    comms.sendFullMessage('AIRCRAFT None PLAYBACK SKIP ' + skipDistance)
}



// These can be removed before release
export function clickTurnRadarOn() {
    comms.sendMessage('RADAR 1')
}

export function clickTurnRadarOff() {
    comms.sendMessage('RADAR 0')
}


export function testFunction() {
    console.log('Test Button Pressed')
    let ac = Aircraft.getActiveAc()
    console.log(ac.icon)
}


export function refreshDisplay() {
    let ac_list = comms.getAircraftList()
    for (let ac of ac_list) {
        comms.sendFullMessage('AIRCRAFT ' + ac.id + ' REQUEST_WAYPOINTS ' + ac.id);
        comms.sendFullMessage('AIRCRAFT ' + ac.id + ' REQUEST_FENCE ' + ac.id)
        comms.sendFullMessage('AIRCRAFT ' + ac.id + ' REQUEST_REPLAN ' + ac.id)
        comms.sendFullMessage('AIRCRAFT ' + ac.id + ' UPDATE_PARAM_LIST')
    }
}