/**
 *
 * @module eventFunctionsTraffic
 * @version 1.0.0
 * @description <b> Event function library for the Traffic Module </b>
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


import * as comms from '../MainJS/comms.js';
import * as Aircraft from '../MainJS/aircraft.js';
import * as map from '../MainJS/map.js';
import * as form from '../MainJS/form.js';
import * as E from '../MainJS/eventFunctions.js';
import * as Traffic from './traffic.js';
import * as save from '../FlyByFile/saveFile.js';

// event listner to remove traffic if no recieved message for a certian time period
window.addEventListener('load', periodicTrafficCleanup);

/**
 * @function <a name="periodicTrafficCleanup">periodicTrafficCleanup</a>
 * @description Removes traffic that has stopped sending messages
 * @param none
 * @memberof module:eventFunctionsTraffic
 */
function periodicTrafficCleanup() {
    setInterval(function () {
        for (let ac of comms.getAircraftList()) {
            for (let i of ac.traffic_list) {
                if (i.inFlight) {
                    if (Date.now() - i.lastUpdate > 5000) {
                        removeTraffic(ac, i)
                    }
                }
            }
        }
    }, 3000)
}

/**
 * @function <a name="updateContextMenuT">updateContextMenuT</a>
 * @description Updates context menu to allow adding traffic
 * @param none
 * @memberof module:eventFunctionsTraffic
 */
export function updateContextMenuT() {
    let mymap = map.getMap()
    mymap.contextmenu.addItem({
        text: "Add Traffic",
        callback: contextAddTraffic
    })
    mymap.contextmenu.addItem({
        separator: true
    })
}


/**
 * @function <a name="onMapClickTraffic">onMapClickTraffic</a>
 * @description makes panel active when traffic icon is clicked, highlights row in table
 * @param e {event} event
 * @memberof module:eventFunctionsTraffic
 */
function onMapClickTraffic(e) {
    let id_list = [];
    let ac = null;
    let ac_id = null;
    let t_id;
    let t;
    let highlight_list = document.getElementsByClassName('highlight');

    for (let item of highlight_list) {
        if (item.parentNode.parentNode.classList.contains('traffic_table')) {
            id_list = item.parentNode.parentNode.parentNode.id.split('_');
            ac_id = id_list[id_list.length - 1]
            ac = Aircraft.getAircraftById(ac_id);
            t_id = id_list[id_list.length - 2];
            t = Traffic.getTrafficById(ac, t_id)

            // Update the cell values
            item.childNodes[1].childNodes[0].value = e.latlng.lat.toString();
            item.childNodes[2].childNodes[0].value = e.latlng.lng.toString();

            t.lat = e.latlng.lat.toString()
            t.lng = e.latlng.lng.toString()
            // move marker from last position to new position
            Traffic.MoveMarker(e, t);
        }
    }
}

/**
 * @function <a name="contextAddTraffic">contextAddTraffic</a>
 * @description wrapper for addT, adds new traffic when context menu is clicked
 * @param e {event} event
 * @memberof module:eventFunctionsTraffic
 */
export function contextAddTraffic(e) {
    let lat = e.latlng.lat
    let lng = e.latlng.lng
    let center = [lat, lng]
    let ac = Aircraft.getActiveAc()
    addT(ac, center)
}

/**
 * @function <a name="clickAddTraffic">clickAddTraffic</a>
 * @description wrapper for addT, adds new traffic when panel button is clicked
 * @param e {event} event
 * @memberof module:eventFunctionsTraffic
 */
export function clickAddTraffic() {
    let ac = E.getACFromElementId(this.id);
    let center = map.getCenter()
    addT(ac, center)
}

/**
 * @function <a name="addT">addT</a>
 * @description adds traffic, creates panel, updates map, all the stuff
 * @param ac {object} Aircraft Object
 * @param center {Array} [lat, lng]
 * @memberof module:eventFunctionsTraffic
 */
export function addT(ac, center) {
    // if this is the first traffic created add layergroup to map
    let ac_list = comms.getAircraftList()

    // adjust the form on window
    window.addEventListener('resize', resizeTrafficForm)

    let mymap = map.getMap()
    mymap.on('click', onMapClickTraffic)

    // define the source of the traffic ('Sim', 'ADSB', 'Sensor')
    let source = 'SIM'
    let emit = 255
    // define marker
    let position = new L.LatLng(center[0], center[1]);
    let bearing = 0; // initial bearing, for plane icon it will be -45
    let t_id;
    // this id = the id of the last element in the traffic list + 1
    if (ac.traffic_list.length == 0) {
        t_id = 1001
    } else {
        t_id = parseInt(ac.traffic_list[ac.traffic_list.length - 1].id) + 1
    }
    let marker = Traffic.defineTrafficMarker(position, bearing, ac.id, t_id, source);

    // create the traffic object
    Traffic.addTraffic(ac, t_id, center[0], center[1], 1, 0, 50, marker, emit, source)

    // update the map
    Traffic.addTrafficToLayer(ac.id, marker)

    // create the panels
    Traffic.createTrafficPanel(ac, t_id);
    Traffic.createTrafficSummaryPanel()

    // update the ac
    clearSubpanelsFromList(ac)
    ac.activeSubPanels.push('ac_traffic_pan_' + t_id + '_' + ac.id)

    // make it active
    form.makePanelActive('ac_' + ac.prev_panel + '_' + ac.id)

    // show the summary button
    let s_btn = document.getElementById('t_summary_pan_btn_' + ac.id)
    if (s_btn) {
        s_btn.classList.replace('hide', 'show')
    }
}

/**
 * @function <a name="resixeTrafficForm">resizeTrafficForm</a>
 * @description updates panel when window size changes
 * @param none
 * @memberof module:eventFunctionsTraffic
 */
export function resizeTrafficForm() {
    let ac = Aircraft.getActiveAc()
    if (ac != null) {
        // get active traffic panel
        let t_list = document.getElementsByClassName('traffic active')
        if (t_list.length > 0 && t_list[0].id != 'ac_traffic_summary') {
            // get the parent element
            let par = t_list[0]
            // get the table
            let id = par.id.split('_')
            let t_id = id[id.length - 2]
            let table = document.getElementById('ac_traffic_table_' + t_id + '_' + ac.id)

            // get the sum of the heights of the children
            let h = 0
            for (let item of par.childNodes) {
                h = h + item.clientHeight
            }
            // subtract the height of the form
            h = h - table.clientHeight

            // adjust the min/max height of the form to fit the remaining space in the panel
            table.style.maxHeight = (par.clientHeight - h - (par.clientHeight * .02)).toString() + 'px'
            table.style.minHeight = (par.clientHeight - h - (par.clientHeight * .02)).toString() + 'px'
        }
    }
}

/**
 * @function <a name="clearSubpanelsFromList">clearSubpanelsFromList</a>
 * @description updates ac.activeSubPanels removes all traffic panels
 * @param none
 * @memberof module:eventFunctionsTraffic
 */
export function clearSubpanelsFromList(ac) {
    for (let item of ac.activeSubPanels) {
        if (item.includes('traffic')) {
            ac.activeSubPanels.splice(ac.activeSubPanels.indexOf(item), 1)
        }
    }
}

/**
 * @function <a name="clickStartTraffic">clickStartTraffic</a>
 * @description formats and sends the start traffic message, updates the panels
 * @param none
 * @memberof module:eventFunctionsTraffic
 */
export function clickStartTraffic() {
    // get ac and traffic
    let ac = E.getACFromElementId(this.id)
    let id = this.id.split('_')
    let t_id = id[id.length - 2]
    let traffic = Traffic.getTrafficById(ac, t_id)
    traffic.inFlight = true

    // prep the message
    let lat = traffic.marker._latlng.lat
    let lng = traffic.marker._latlng.lng
    let range = 0;
    let bearing = document.getElementById('BER_T_' + t_id + '_Bearing: deg. _' + ac.id).value;
    let altitude = document.getElementById('ALT_T_' + t_id + '_Altitude: MSL _' + ac.id).value;
    let heading = document.getElementById('BER_T_' + t_id + '_Bearing: deg. _' + ac.id).value;
    let gs = document.getElementById('VEL_T_' + t_id + '_Velocity: m/s _' + ac.id).value;
    let vs = 0;
    let emit = 255

    let msg = 'ADD_TRAFFIC ' + t_id +
        ' ' + lat +
        ' ' + lng +
        ' ' + range +
        ' ' + bearing +
        ' ' + altitude +
        ' ' + gs +
        ' ' + heading +
        ' ' + vs +
        ' ' + emit

    // send message

    comms.sendFullMessage(msg);

    // update the ac
    clearSubpanelsFromList(ac)
    ac.activeSubPanels.push('ac_traffic_summary')

    // return to prev_panel
    form.makePanelActive('ac_' + ac.prev_panel + '_' + ac.id);
    Traffic.updateTrafficSummaryPanel()

    Traffic.removeTrafficMarker(ac.id, traffic.marker)
    Traffic.removeTrafficFromList(ac, t_id)
}

/**
 * @function <a name="contextRemoveTraffic">contextRemoveTraffic</a>
 * @description Removes traffic after right click on icon, wrapper for removeTraffic
 * @param none
 * @memberof module:eventFunctionsTraffic
 */
export function contextRemoveTraffic() {
    let ac_id = this.contextmenu._showLocation.relatedTarget.options.aircraft
    let t_id = this.contextmenu._showLocation.relatedTarget.options.traffic
    let ac = Aircraft.getAircraftById(ac_id)
    let traffic = Traffic.getTrafficById(ac, t_id)
    removeTraffic(ac, traffic)
}

/**
 * @function <a name="lcik">periodicTrafficCleanup</a>
 * @description Removes traffic after click '-' button on traffic summary panel, wrapper for removeTraffic
 * @param none
 * @memberof module:eventFunctionsTraffic
 */
export function clickRemoveTraffic() {
    let id_list = this.id.split('_')
    let id = id_list[id_list.length - 1]
    let t_id = id_list[id_list.length - 2]

    // get the traffic object
    let ac = Aircraft.getAircraftById(id)
    let traffic = Traffic.getTrafficById(ac, t_id)
    removeTraffic(ac, traffic)
}

/**
 * @function <a name="removeTraffic">removeTraffic</a>
 * @description Removes traffic, updates map, removes and updates panels
 * @param ac {Object} Aircraft Object
 * @param t {Object} Traffic Object
 * @memberof module:eventFunctionsTraffic
 */
export function removeTraffic(ac, t) {
    let t_panel
    for (let a of comms.getAircraftList()) {
        // find all of the traffic with the same id and remove it
        for (let tr of a.traffic_list) {
            if (tr.id == t.id) {
                Traffic.removeTrafficMarker(a.id, tr.marker)

                // update ac
                a.activeSubPanels = a.activeSubPanels.filter(el => el != 'ac_traffic_pan_' + tr.id + '_' + a.id)

                // remove panel
                t_panel = document.getElementById('ac_traffic_pan_' + tr.id + '_' + a.id)
                t_panel.parentNode.removeChild(t_panel)

                // remove from traffic list
                Traffic.removeTrafficFromList(a, tr.id)

                // send message to server to remove traffic
                comms.sendFullMessage('REMOVE_TRAFFIC ' + tr.id)

                // update summary panel
                Traffic.updateTrafficSummaryPanel()
            }
        }
    }
}


/**
 * @function <a name="clickShowTrafficSummary">clickShowTrafficSummary</a>
 * @description Shows or hides the traffic summary panel
 * @todo fix doesn't work well
 * @param none
 * @memberof module:eventFunctionsTraffic
 */
export function clickShowTrafficSummary() {
    let id_list = this.id.split('_')
    let id = id_list[id_list.length - 1]
    let ac = Aircraft.getAircraftById(id)
    let btn = document.getElementById(this.id)

    // hide any active traffic panels
    clearSubpanelsFromList(ac)

    if (btn.innerHTML == 'Show Traffic Summary') {
        ac.activeSubPanels.push('ac_traffic_summary')

        // hide the show button
        btn.classList.replace('show', 'hide')

        // show the hide button
        let h_btn_in = document.getElementById('t_summary_hide_' + ac.prev_panel + '_btn_' + id)
        h_btn_in.classList.replace('hide', 'show')

    } else if (btn.innerHTML == 'Hide Traffic Panel') {
        // hide the hide button
        btn.classList.replace('show', 'hide')

        // show the show button
        let s_btn_in = document.getElementById('t_summary_' + ac.prev_panel + '_btn_' + id)
        s_btn_in.classList.replace('hide', 'show')
    }
    // refresh the main panel
    form.makePanelActive('ac_' + ac.prev_panel + '_' + ac.id)
}

/**
 * @function <a name="clickTrafficMarker">clickTrafficMarker</a>
 * @description on click, makes ac and traffic panel active
 * @param none
 * @memberof module:eventFunctionsTraffic
 */
export function clickTrafficMarker() {
    let id = this.options.aircraft
    let t_id = this.options.traffic
    let ac = Aircraft.getAircraftById(id)
    let traffic = Traffic.getTrafficById(ac, t_id)

    if (traffic.inFlight == false) {
        // hide any active traffic panels
        clearSubpanelsFromList(ac)
        ac.activeSubPanels.push('ac_traffic_pan_' + t_id + '_' + id)
        form.makePanelActive('ac_' + ac.prev_panel + '_' + ac.id)

        // highlight row associated with this marker
        form.removeHighlight()
        document.getElementById('row_traffic_' + ac.id + '_' + t_id).classList.add('highlight')
    } else {
        clearSubpanelsFromList(ac)
        ac.activeSubPanels.push('ac_traffic_summary')
        form.makePanelActive('ac_' + ac.prev_panel + '_' + ac.id)

        // find the row in the summary panel
        let tp = document.getElementsByClassName('t_p')
        for (let item of tp) {
            // clear all highlighted rows
            let x = item.innerHTML.split(' ')
            let p_id = x[1]
            let p_t_id = x[3]
            if (p_id == id && p_t_id == t_id) {
                item.classList.add('highlight')
            }
        }
    }
}

/**
 * @function <a name="makeTrafficPanelActive">makeTrafficPanelActive</a>
 * @description updates the aircraft's active sub panel list and adds this ac to the list
 * @param pan_id {string} id of the panel to add
 * @memberof module:eventFunctionsTraffic
 */
export function makeTrafficPanelActive(pan_id) {

    let id_list = pan_id.split('_')
    let id = id_list[id_list.length - 1]
    let ac = Aircraft.getAircraftById(id)
    // clear all highlighted rows
    form.removeHighlight()

    // update the ac
    clearSubpanelsFromList(ac)
    ac.activeSubPanels.push(pan_id)

    // make the panel active
    form.makePanelActive('ac_' + ac.prev_panel + '_' + ac.id)

}

/**
 * @function <a name="inputTrafficBearin">inputTrafficBearing</a>
 * @description updates the traffic bearing when the user presses enter, rotates the marker to that bearing
 * @param e {event} event
 * @memberof module:eventFunctionsTraffic
 */
export function inputTraficBearing(e) {
    if (e.key == 'Enter') {
        // get active panels
        let active = document.getElementsByClassName('active')
        let id
        let t_id
        let ac
        let t
        let in_val
        let traffic
        for (let item of active) {
            traffic = Array.from(item.classList).filter(function (el) {
                if (el == 'traffic') {
                    // split the id and get ac id and traffic id
                    id = item.id.split('_')
                    t_id = id[id.length - 2]
                    ac = Aircraft.getActiveAc()
                    t = Traffic.getTrafficById(ac, t_id)

                    // get the bearing
                    in_val = document.getElementById('BER_T_' + t.id + '_Bearing: deg. _' + ac.id).value
                    if (in_val > 360 || in_val < 0) {
                        form.alertBannerRed('Input bearing must be between 0 and 360 degrees.')
                        return
                    }
                    if (t.source == 'SIM') {
                        t.hdg = in_val
                    } else {
                        t.hdg = in_val - 45
                    }

                    // update the marker
                    t.marker.setRotationAngle(t.hdg)
                }
            })
        }
    }
}

/**
 * @function <a name="enterSaveTraffic">enterSaveTraffic</a>
 * @description formats and sends save traffic to file message when user presses enter
 * @param e {event} event
 * @memberof module:eventFunctionsTraffic
 */
export function enterSaveTraffic(e) {
    if (e.key == 'Enter') {
        let sub = document.getElementsByClassName('traffic active')
        let id
        let t_id
        if (sub.length > 0) {
            for (let item of sub) {
                id = item.id.split('_')
                t_id = id[3]
            }
        }

        let ac = Aircraft.getActiveAc()
        let lat = document.getElementById('LAT_traffic_' + ac.id + '_' + t_id).value
        let lng = document.getElementById('LNG_traffic_' + ac.id + '_' + t_id).value
        let alt = document.getElementById('ALT_T_' + t_id + '_Altitude: MSL _' + ac.id).value;
        let hdg = document.getElementById('BER_T_' + t_id + '_Bearing: deg. _' + ac.id).value;
        let vel = document.getElementById('VEL_T_' + t_id + '_Velocity: m/s _' + ac.id).value;
        let t = Traffic.getTrafficById(ac, t_id)
        let emit = t.emit

        let filename = e.srcElement.value
        save.save_traffic(ac, lat, lng, alt, vel, hdg, emit, filename)
    }
}