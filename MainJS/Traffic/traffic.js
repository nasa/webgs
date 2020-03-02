/**
 *
 * @module traffic
 * @version 1.0.1
 * @description <b> Traffic Module </b>
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

import * as M from '../views/map.js';
import * as E from '../control/eventFunctions.js';

import * as F from '../views/form.js';

import * as ET from './eventFunctionsTraffic.js';

export class Traffic {
    /**
     * @function <a name="Traffic">Traffic</a>
     * @description Constructor.
     * @param t_id {string} traffic id
     * @param lat {real} lat
     * @param lng {real} lng
     * @param hdg {real} heading in def
     * @param alt {real} altitude in m
     * @param marker {Object} L.marker object
     * @param source {string} type of traffic
     * @param emit {real} emiter code
     * @param time {Date} Date last heard
     * @memberof module:traffic
     * @class Aircraft
     * @instance
     */
    constructor(t_id, lat, lng, vel, hdg, alt, marker, source, emit, time) {
        this.id = t_id;
        this.lat = lat;
        this.lng = lng;
        this.alt = alt;
        this.vel = vel;
        this.hdg = hdg;
        this.range = 0
        this.bearing = hdg
        this.vs = 0
        this.emit = emit
        this.marker = marker;
        this.inFlight = false;
        this.source = source;
        this.lastUpdate = time;
        this.multi = true;
        this.callsign = ''
    }
}

/**
 * @function <a name="addTraffic">addTraffic</a>
 * @description creates a new traffic object and adds it to the ac traffic list
 * @param ac {Object} Aircraft object.
 * @param t_id {string} traffic id
 * @param lat {real} lat
 * @param lng {real} lng
 * @param hdg {real} heading in def
 * @param alt {real} altitude in m
 * @param marker {Object} L.marker object
 * @param emit {real} emiter code
 * @param source {string} type of traffic
 * @memberof module:traffic
 */
export function addTraffic(ac, t_id, lat, lng, vel, hdg, alt, marker, emit, source, time) {
    let traffic = new Traffic(t_id, lat, lng, vel, hdg, alt, marker, source, emit, time)
    ac.traffic_list.push(traffic)
}

/**
 * @function <a name="removeTrafficFromList">removeTrafficFromList</a>
 * @description removes traffic object from aircraft traffic list
 * @param ac {Object} Aircraft object.
 * @param t_id {string} traffic id
 * @memberof module:traffic
 */
export function removeTrafficFromList(ac, t_id) {
    for (let i in ac.traffic_list) {
        if (ac.traffic_list[i].id == t_id) {
            ac.traffic_list.splice(i, 1)
        }
    }
}

/**
 * @function <a name="getTrafficById">getTrafficById</a>
 * @description Helper function, get traffic object given id and aircraft
 * @param ac {Object} Aircraft object.
 * @param t_id {string} traffic id
 * @returns {Object|String} traffic object or 'Traffic not found'
 * @memberof module:traffic
 */
export function getTrafficById(ac, t_id) {
    let t = ac.traffic_list.filter(function (el) {
        return el.id == t_id
    })
    if (t.length > 0) {
        return t[0]
    } else {
        return 'Traffic not found'
    }
}

/**
 * @function <a name="getTrafficIcon">getTrafficIcon</a>
 * @description selects icon based on input source and aircraft id
 * @param id {Integer} aircraft id
 * @param source {string} traffic source
 * @returns {Object} L.icon
 * @memberof module:traffic
 */
export function getTrafficIcon(id, source) {
    let icon;
    // console.log(source)
    if (source == 'SIM') {
        icon = 'MainJS/Traffic/images/quad_solid_sim.svg'
    } else if (source == 'ADSB') {
        icon = 'MainJS/Traffic/images/plane_adsb.svg'
    } else if (source == 'SENSOR') {
        icon = 'MainJS/Traffic/images/plane_sensor.svg'
    }

    let trafficIcon = L.icon({
        iconUrl: icon,
        shadowUrl: '',
        iconSize: [30, 30], // size of the icon
        shadowSize: [50, 64], // size of the shadow
        shadowAnchor: [4, 62], // the same for the shadow
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    return trafficIcon;
}


// ***********************************************************
// form stuff

/**
 * @function <a name="addSimTrafficButtons">addSimTrafficButtons</a>
 * @description adds traffic buttons to the aircraft panel
 * @param btn_div {Object} HTML Div
 * @param id {string} aircraft id
 * @param t {string} traffic id
 * @returns {Object} HTML Div
 * @memberof module:traffic
 */
export function addSimTrafficButtons(btn_div, id, t) {
    // add a add traffic button
    btn_div.appendChild(F.addBlockButton(id, 'traffic', 'Add Traffic', ET.clickAddTraffic));

    // show traffic summary panel
    createTrafficSummaryPanel()
    btn_div.appendChild(F.addBlockButton(id, 't_summary_' + t, 'Show Traffic Summary', ET.clickShowTrafficSummary))
    let s_btn = btn_div.lastChild.lastChild
    s_btn.classList.add('show')

    // add hide traffic panel button
    btn_div.appendChild(F.addBlockButton(id, 't_summary_hide_' + t, 'Hide Traffic Panel', ET.clickShowTrafficSummary))
    let h_btn = btn_div.lastChild.lastChild
    h_btn.classList.add('hide')

    return btn_div
}

/**
 * @function <a name="createTrafficPanel">createTrafficPanel</a>
 * @description creates traffic planning panel
 * @param ac {Object} Aircraft object.
 * @param t_id {string} traffic id
 * @memberof module:traffic
 */
export function createTrafficPanel(ac, t_id) {
    let pan_id = 'ac_traffic_pan_' + t_id + '_' + ac.id

    let option_div = document.getElementById('option_div')
    // add panel
    let ac_pan_div = document.createElement('div');
    ac_pan_div.setAttribute('class', 'panel-body wrapper traffic hide sub');
    ac_pan_div.setAttribute('id', pan_id);
    option_div.appendChild(ac_pan_div);

    // Add label to panel
    let pan_label = document.createElement('h5');
    pan_label.innerHTML = ' Traffic: ' + t_id
    ac_pan_div.appendChild(pan_label);
    let traffic = getTrafficById(ac, t_id)

    // add form
    createTrafficPlanTable(ac, t_id);

    // create div for btns
    let btn_div = document.createElement('div')
    btn_div.setAttribute('class', 't_btndiv')

    // add save traffic to file
    btn_div.appendChild(F.addTextInput('t_file_save_' + t_id + '_' + ac.id, "Save To File", MODE.save_traffic_default, ET.enterSaveTraffic))

    // add a add start traffic button
    btn_div.appendChild(F.addBlockButton(t_id + '_' + ac.id, 'start_traffic', 'Start Traffic', ET.clickStartTraffic));

    // add a remove traffic button
    btn_div.appendChild(F.addBlockButton(t_id + '_' + ac.id, 'remove_traffic', 'Remove Traffic', ET.clickRemoveTraffic));

    ac_pan_div.appendChild(btn_div)
}

/**
 * @function <a name="highlightMultiToggle">highlightMultToggle</a>
 * @description Highlights active multi aircraft traffic button
 * @param t {Object} Traffic object.
 * @memberof module:traffic
 */
export function highlightMultiToggle(t) {
    let on = document.getElementById('multi_ac_t_on')
    let off = document.getElementById('multi_ac_t_off')
    if (t.multi) {
        on.classList.add('highlight_f')
        off.classList.remove('highlight_f')
    } else {
        off.classList.add('highlight_f')
        on.classList.remove('highlight_f')
    }
}


/**
 * @function <a name="createTrafficPlanTable">createTrafficPlanTable</a>
 * @description Creates Traffic Plan Table
 * @param ac {Object} Aircraft object.
 * @param t_id {string} traffic id
 * @memberof module:traffic
 */
function createTrafficPlanTable(ac, t_id) {

    // add altitude
    let alt_div = F.addNumberInput(ac.id, 'ALT_T_' + t_id, 'Altitude: MSL ', 1, 8, 50);
    document.getElementById('ac_traffic_pan_' + t_id + '_' + ac.id).appendChild(alt_div);

    // add velocity
    let vel_div = F.addNumberInput(ac.id, 'VEL_T_' + t_id, 'Velocity: m/s ', 1, 8, 1);
    document.getElementById('ac_traffic_pan_' + t_id + '_' + ac.id).appendChild(vel_div);

    // add bearing
    let ber_div = F.addNumberInput(ac.id, 'BER_T_' + t_id, 'Bearing: deg. ', 1, 8, 0, ET.inputTraficBearing);
    document.getElementById('ac_traffic_pan_' + t_id + '_' + ac.id).appendChild(ber_div);

    // build the table
    let table = document.createElement("TABLE");
    table.setAttribute('id', "ac_traffic_table_" + t_id + '_' + ac.id);
    table.setAttribute('class', "table traffic_table")
    document.getElementById('ac_traffic_pan_' + t_id + '_' + ac.id).appendChild(table);

    let header = table.createTHead();
    let rowh = header.insertRow(0);
    let cols = ['ID', 'LAT', 'LNG', '', ''];

    // insert elements into header
    for (let i = 0; i < cols.length; i++) {
        let cell_head = rowh.insertCell();
        cell_head.innerHTML = cols[i];
    }

    let row_num = t_id;
    F.updateTable(table, ac.id, 'traffic', row_num);

    // highlight selected row
    table.addEventListener('click', E.clickTable);
}

/**
 * @function <a name="createTrafficSummaryPanel">createTrafficSummaryPanel</a>
 * @description Creates Traffic summary panel
 * @param none
 * @memberof module:traffic
 */
export function createTrafficSummaryPanel() {
    // if there already is a traffic summary panel don't create a new one
    if (document.getElementById('ac_traffic_summary') == null) {
        // update the ac


        // create the panel
        let option_div = document.getElementById('option_div')
        let pan_id = 'ac_traffic_summary'
        let pan = document.createElement('div');
        pan.setAttribute('class', 'panel-body wrapper traffic hide sub');
        pan.setAttribute('id', pan_id);
        option_div.appendChild(pan);
    }
    // add the info
    updateTrafficSummaryPanel()
}

/**
 * @function <a name="updateTrafficSummaryPanel">updateTrafficSummaryPanel</a>
 * @description Updates Traffic summary panel
 * @param none
 * @memberof module:traffic
 */
export function updateTrafficSummaryPanel() {
    // get the summary panel
    let pan = document.getElementById('ac_traffic_summary')

    // remove the current info
    let children = pan.childNodes
    for (let i = children.length - 1; i >= 0; i--) {
        pan.removeChild(children[i])
    }


    // add the new info
    let title = document.createElement('h5')
    title.innerHTML = 'Traffic Summary'
    let ul = document.createElement('ul')
    ul.setAttribute('class', 't_summary_list')
    let li;
    let stuff;
    let p;
    for (let ac of AM.getAircraftList()) {
        for (let i of ac.traffic_list) {
            i.lastUpdate = Date.now()
            // update the list
            li = document.createElement('li')
            // li.setAttribute('class', 't_summary_list')
            p = document.createElement('p')
            stuff = 'AC: ' + ac.name +
                ' T: ' + i.id + " " +
                ' Callsign: ' + i.callsign +
                ' Source: ' + i.source +
                ' Multi: ' + i.multi +
                '<br />' +
                ' Lat ' + parseFloat(i.lat).toPrecision(7) +
                ' Lng ' + parseFloat(i.lng).toPrecision(7) +
                ' Alt ' + i.alt +
                ' Hdg ' + i.hdg +
                ' Vel ' + i.vel
            p.innerHTML = stuff

            // add a remove traffic button
            let btn = F.addBlockButton(i.id + '_' + ac.id, '-', '-', ET.clickRemoveTraffic)
            p.setAttribute('class', 't_p')
            btn.setAttribute('class', 't_-')

            ul.appendChild(li)
            li.appendChild(p)

            // if traffic has not started add an edit button that goes back to the traffic panel
            if (i.inFlight == false) {
                let edit_btn = F.addBlockButton(i.id + '_' + ac.id, 'edit', 'edit', function (e) {
                    ET.makeTrafficPanelActive('ac_traffic_pan_' + i.id + '_' + ac.id)
                })
                edit_btn.firstChild.innerHTML = '<img src="images/Edit-01.svg" />'
                edit_btn.setAttribute('class', 't_-')
                li.appendChild(edit_btn)
            }

            li.appendChild(btn)

        }
    }

    pan.appendChild(title)
    pan.appendChild(ul)
}

// ********************************************************
// map stuff

/**
 * @function <a name="UpdateTraffic">UpdateTraffic</a>
 * @description Updates position of traffic on map, or creates new object based on recieved messages in comms
 * @param t_id {string} traffic id
 * @param source {string} source descriptor
 * @param lat {real} lat
 * @param lng {real} lng
 * @param hdg {real} heading in def
 * @param alt {real} altitude in m
 * @param marker {Object} L.marker object
 * @param emit {real} emiter code
 * @param ac_id {string} aircraft id
 * @memberof module:traffic
 */
export function UpdateTraffic(t_id, source, lat, lng, vel, hdg, alt, emit, ac_id, callsign) {

    let ac = AM.getAircraftById(ac_id)
    // find this traffic in traffic_list else create new
    let traffic = ac.traffic_list.filter(function (t) {
        if (t.id == t_id) {
            return t
        }
    })

    if (traffic.length == 0) {
        traffic = -99
    } else {
        traffic = traffic[0] // filter returns an array
    }

    if (callsign.length == 0) {
        callsign = t_id
    }

    // check for valid inputs may be int not float
    if (Number.isInteger(lat)) {
        lat = lat / 10000000
        lng = lng / 10000000
        vel = vel / 100
        hdg = hdg / 100
        alt = alt / 1000
    }

    // update the existing traffic object
    if (traffic != -99) {
        //move the marker
        let marker = traffic.marker
        let position = new L.LatLng(parseFloat(lat), parseFloat(lng));

        marker.setLatLng(position)

        // update the aircraft
        traffic.lat = lat
        traffic.lng = lng
        traffic.hdg = hdg
        traffic.vel = vel
        traffic.alt = alt
        traffic.callsign = callsign
        traffic.inFlight = true
        traffic.lastUpdate = Date.now()
        if (traffic.source == 'SIM' || traffic.source == 'MULTI') {
            traffic.marker.setRotationAngle(traffic.hdg) // adjust for icon rotation
        } else {
            traffic.marker.setRotationAngle(traffic.hdg - 45) // adjust for icon rotation
        }


    } else {

        // make sure there is a traffic layer on the map
        if (!M.checkForLayer('Aircraft ' + ac.id)) {
            F.alertBannerRed('Layer not found. Unable to add Traffic. ac: ' + ac.id + ' t: ' + t_id)
            // ignore the message until the aircraft layer has been created
            return
        }

        // create new traffic object
        let position = new L.LatLng(ac.lat, ac.lng);
        let marker = defineTrafficMarker(position, traffic.hdg, ac.id, t_id, source, callsign);
        // update the aircraft
        let time = Date.now()
        addTraffic(ac, t_id, lat, lng, vel, hdg, alt, marker, emit, source, time)
        let t = getTrafficById(ac, t_id)
        t.inFlight = true
        t.callsign = callsign

        // update the map
        addTrafficToLayer(ac.id, marker)

        // add panels
        createTrafficPanel(ac, t_id)
        let sum = document.getElementById('ac_traffic_summary')
        if (sum == null) {
            createTrafficSummaryPanel()
        } else {
            updateTrafficSummaryPanel()
        }
        // make summary panel active
        sum = document.getElementById('ac_traffic_summary')
        let removed = ac.activeSubPanels.forEach(el => {
            if (!el.includes('traffic')) {
                return el
            }
        })
        if (removed == undefined) {
            ac.activeSubPanels = []
        } else {
            ac.activeSubPanels = removed
        }
        ac.activeSubPanels.push('ac_traffic_summary')
        F.makePanelActive('ac_pan_' + ac.id)
    }
}


/**
 * @function <a name="removeTrafficMarker">removeTrafficMarker</a>
 * @description removes traffic marker from map, wrapper for map.removeMarkerFromLayer
 * @param id {string} layer id (aircraft id)
 * @param marker {Object} L.marker
 * @memberof module:GeoFence
 */
export function removeTrafficMarker(id, marker) {
    M.removeMarkerFromLayer(id, marker)
}

/**
 * @function <a name="addTrafficTolayer">addTrafficTolayer</a>
 * @description puts traffic marker on map, wrapper for map.addMarkerToLayer
 * @param id {string} layer id (aircraft id)
 * @param wp {Object} L.marker
 * @memberof module:GeoFence
 */
export function addTrafficToLayer(id, wp) {
    M.addMarkerToLayer(id, wp)
}

/**
 * @function <a name="MoveMarker">MoveMarker</a>
 * @description moves a marker already on map, redraws fence
 * @param e {event} event
 * @param traffic {Object} Traffic Object
 * @memberof module:GeoFence
 */
export function MoveMarker(e, traffic) {
    // get new position
    let newLatLng = new L.LatLng(e.latlng.lat, e.latlng.lng);
    // update position
    traffic.marker.setLatLng(newLatLng);
}


/**
 * @function <a name="defineTrafficMarker">defineTrafficMarker</a>
 * @description moves a marker already on map, redraws fence
 * @param position {Object} L.latlng
 * @param bearing {real} degrees
 * @param id {string}
 * @param t_id {string}
 * @param source {string}
 * @returns {Object} L.marker
 * @memberof module:GeoFence
 */
export function defineTrafficMarker(position, bearing, id, t_id, source, callsign) {
    if (source == 'ADSB' || source == 'SENSOR') {
        bearing = bearing - 45
    }
    let acMarker = new L.marker(position, {
        aircraft: id,
        traffic: t_id,
        rotationAngle: bearing,
        rotationOrigin: 'center center',
        icon: getTrafficIcon(id, source),
        contextmenu: true,
        contextmenuItems: [{
            text: 'Remove Traffic',
            callback: ET.contextRemoveTraffic
        }],
        contextmenuInheritItems: false

    })
    if (MODE.label) {
        acMarker.bindTooltip(callsign.toString(), {
            permanent: true,
            direction: 'right',
            offset: L.point(20, 10),
            className: 'myToolTip'
        })
    }
    acMarker.on('click', ET.clickTrafficMarker);
    return acMarker;
}