/**
 *
 * @module map
 * @version 1.0.1
 * @description <b> map module </b>
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
import * as E from '../control/eventFunctions.js'

import * as W from '../models/waypoint.js'

import * as F from '../views/form.js'


import * as MapBox from '../settings/MapSettings.js'
import * as G from '../Geofence/geofence.js'



function getLocalCenter() {
    let c = MapBox.center
    let x = localStorage.getItem('center')
    if (x) {
        x = x.split(',')
        if (x[0] && x[1]) {
            c = x
        }
    }
    return c
}

function getLocalZoom() {
    let z = MapBox.zoom
    let x = localStorage.getItem('zoom')
    if (x) {
        z = x
    }
    return z
}

let center = getLocalCenter()
let zoom = getLocalZoom()
let baseMaps = MapBox.baseMaps
let overlayMaps = {}
let layers = MapBox.layers


/**
 * @variable <a name="mymap">mymap</a>
 * @description Leaflet map object.
 * @param none
 * @memberof module:map
 * @listens {click} onMapClick
 * @listens {moveend} onMapMove
 * @listens {baselayerchange} MapBox.setMapDisplayStyle
 */
let mymap = L.map('mapid', {
    center: center,
    zoom: zoom,
    layers: layers,
    contextmenu: true,
    contextmenuItems: [{
        text: 'New Aircraft',
        callback: E.createNewAircraft
    }, {
        separator: true
    }]
});

mymap.on('click', onMapClick);
mymap.on('moveend', onMapMove);
mymap.on('baselayerchange', MapBox.setMapDisplayStyle)
mymap.on('baselayerchange', function () {
    DrawFlightPlan()
    DrawRePlan()
    G.drawGeofences()
})

/**
 * @variable <a name="layerControl">clayercontrol</a>
 * @description Leaflet control layers object.
 * @param none
 * @memberof module:map
 */
export let layerControl = new L.control.layers(baseMaps, overlayMaps).addTo(mymap);


/**
 * @function <a name="moveMap">moveMap</a>
 * @description Pans the map to new lat, lng.
 * @param lat {real} lat
 * @param lng {real} lng
 * @memberof module:map
 */
export function moveMap(lat, lng) {
    let latlng = new L.latLng(lat, lng)
    mymap.panTo(latlng)
}

/**
 * @function <a name="onMapMove">onMapMove</a>
 * @description Updates the center of the map and updates the settings panel.
 * @param none
 * @memberof module:map
 */
function onMapMove() {
    center = [mymap.getCenter().lat, mymap.getCenter().lng]
    zoom = mymap.getZoom()
    E.setLocalStorage(zoom, 'zoom')
    F.updateSettingsPanel()
}

/**
 * @function <a name="getMap">getMap</a>
 * @description returns map object.
 * @param none
 * @return {Object} map object
 * @todo Get rid of this export var.
 * @memberof module:map
 */
export function getMap() {
    return mymap;
}

/**
 * @function <a name="getCenter">getCenter</a>
 * @description returns center of map.
 * @param none
 * @return {Array} [lat, lng]
 * @todo Get rid of this export var.
 * @memberof module:map
 */
export function getCenter() {
    return center;
}



/**
 * @function <a name="setCenter">setCenter</a>
 * @description Sets the map center
 * @param lat {real} lat
 * @param lng {real} lng
 * @todo Get rid of this export var. Check if this is even used.
 * @memberof module:map
 */
export function setCenter(lat, lng) {
    center = [lat, lng]
}




/**
 * @function <a name="addNewLayerGroup">addNewLayerGroup</a>
 * @description Adds layer to the map and the control menu
 * @param ac {Object} Aircraft Object.
 * @todo Get rid of the x.
 * @memberof module:map
 */
export function addNewLayerGroup(ac) {
    let layer = new L.layerGroup()
    let x = layerControl.addOverlay(layer, 'Aircraft ' + ac.id).addTo(mymap)
}

/**
 * @function <a name="checkForLayer">checkForLayer</a>
 * @description checks for a given layer.
 * @param name {string} name of layer.
 * @return {boolean} True=has layer, False=No layer
 * @todo only used by traffic not really needed
 * @memberof module:map
 */
export function checkForLayer(name) {
    for (let item of layerControl._layers) {
        if (item.name == name) {
            return true
        }
    }
    return false
}

/**
 * @function <a name="getLayer">getLayer</a>
 * @description returns map layer if found, else 'layer not found'.
 * @param name {string} Name of Layer.
 * @return {Object} map layer.
 * @memberof module:map
 */
export function getLayer(name) {
    for (let item of layerControl._layers) {
        if (item.name == name) {
            return item
        }
    }
    return 'layer not found'
}

/**
 * @function <a name="removeLayer">removeLayer</a>
 * @description removes layer from map and control menu.
 * @param name {string} Name of layer.
 * @memberof module:map
 */
export function removeLayer(name) {
    let layers = {}
    for (let item of layerControl._layers) {
        if (item.name == name) {
            mymap.removeLayer(item)

        } else if (!baseMaps.hasOwnProperty(item.name)) {
            layers[item.name] = item.layer
        }
    }
    layerControl.remove(mymap)
    layerControl = new L.control.layers(baseMaps, layers).addTo(mymap);
}


let red_marker = L.icon({
    iconUrl: 'images/red_marker.svg',
    shadowUrl: '',
    iconSize: [20, 20], // size of the icon
    iconAnchor: [10, 20],
    shadowSize: [50, 64], // size of the shadow
    shadowAnchor: [4, 62], // the same for the shadow
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

/**
 * @function <a name="defineWPMarker">defineWPMarker</a>
 * @description Creates wp leaflet marker object.
 * @param position {Object} leaflet latlng object
 * @param id {string} aircraft id of this wp.
 * @return {Object} leaflet marker object
 * @memberof module:map
 */
export function defineWPMarker(position, id) {
    let wpMarker = new L.marker(position, {
        aircraft: id,
        contextmenu: true,
        icon: red_marker,
        contextmenuItems: [{
            text: 'Remove Waypoint',
            callback: RemoveWaypoint
        }],
        contextmenuInheritItems: false
    });
    wpMarker.on('click', onMarkerClick);
    return wpMarker;
}

/**
 * @function <a name="getMap">getMap</a>
 * @description returns map object.
 * @param none
 * @return {Object} map object
 * @todo Get rid of this export var.
 * @memberof module:map
 */
function onMarkerClick(e) {
    // highlight row associated with the marker
    let lat = e.target._latlng.lat;
    let lng = e.target._latlng.lng;

    // get associated ac
    let id = e.target.options.aircraft;
    let ac = AM.getAircraftById(id);

    // make active
    F.makePanelActive('ac_' + ac.id);

    // Only move the marker if the plan has not been submitted
    if (ac.status == 0) {
        // find the row number to highlight
        let row = 0;
        for (let i = 0; i < ac.flightplan.length; i++) {
            if (ac.flightplan[i].latlng.lat == lat && ac.flightplan[i].latlng.lng == lng) {
                row = i;
            }
        }
        // highlight row
        F.removeHighlight()
        let h_row = document.getElementById('row_fp_' + ac.id + '_' + row);
        h_row.setAttribute('class', 'fp_row highlight')
    }

}

function onAcClick(e) {
    console.log(e)
    let id = e.target.options.aircraft;
    let ac = AM.getAircraftById(id);
    F.makePanelActive('ac_' + ac.id)
}


export function addMarkerToLayer(id, wp) {
    let this_layer = 'Aircraft ' + id;
    let count = 0
    for (let item of layerControl._layers) {
        if (item.name == this_layer) {
            item.layer.addLayer(wp);
            // if first, turn layer on
            if (Object.keys(item.layer._layers).length <= 1) {
                layerControl._layerControlInputs[count].click()
            }
        }
        count += 1
    }
}


export function removeMarkerFromLayer(id, wp) {
    let this_layer = 'Aircraft ' + id;
    for (let item of layerControl._layers) {
        if (item.name == this_layer) {
            item.layer.removeLayer(wp)
        }
    }
}


export function updateFlightPlanOnRowCreate(ac) {
    // create new default wp and show on map
    let newLatLng = new L.LatLng(center[0], center[1])
    let wp = new W.Waypoint(newLatLng, ac.u_alt);
    wp.wpMarker = defineWPMarker(newLatLng, ac.id);
    addMarkerToLayer(ac.id, wp.wpMarker);
    ac.flightplan.push(wp)
}


export function AddNewWaypointClick(e) {
    // get active aircraft
    let ac = AM.getActiveAc();

    //create new wp and show on map
    let newLatLng = new L.LatLng(e.latlng.lat, e.latlng.lng)
    let wp = new W.Waypoint(newLatLng, ac.u_alt);
    wp.wpMarker = defineWPMarker(newLatLng, ac.id);
    addMarkerToLayer(ac.id, wp.wpMarker)
    ac.flightplan.push(wp);

    // decide what to do depending on ac status
    let table = document.getElementById('ac_fp_table_' + ac.id);
    if (ac.status >= 2) {
        //not sure what to do here
        //connection.send('AC_ID ' + ac.id + ' New WP: '+ e.latlng.lat.toString() + ' ' + e.latlng.lng.toString())
    } else if (ac.status == 1) {
        // simulate hitting edit flight plan and adding a new row
        ac.status = 0;
        F.makePanelActive('ac_pan_' + ac.id);
        F.updateTable(table, ac.id, 'fp', ac.flightplan.length - 1, E.clickAddRowButton, E.clickRemoveRowButton);
        let count = table.getElementsByClassName('fp_row').length;
        setRowValue(ac.id, 'fp', count - 1, e.latlng.lat.toString(), e.latlng.lng.toString(), ac.u_alt);
    } else if (ac.status == 0) {
        // add row
        F.updateTable(table, ac.id, 'fp', ac.flightplan.length - 1, E.clickAddRowButton, E.clickRemoveRowButton);
        let count = table.getElementsByClassName('fp_row').length;
        setRowValue(ac.id, 'fp', count - 1, e.latlng.lat.toString(), e.latlng.lng.toString(), ac.u_alt);
    }

    DrawFlightPlan();
}


function MoveWaypoint(e, marker) {
    // get new position
    let newLatLng = new L.LatLng(e.latlng.lat, e.latlng.lng);
    // update position
    marker.wpMarker.setLatLng(newLatLng);
    marker.latlng = newLatLng;
    // Redraw Flight Path
    DrawFlightPlan();
}


// removes the wp, marker, adjusts flight plan, and rebuilds form when
// rt click on marker and press remove
function RemoveWaypoint(e) {
    let ac = AM.getAircraftById(e.relatedTarget.options.aircraft);
    RemoveRowAndWp(ac);
}


export function RemoveRowAndWp(ac) {
    // don't remove if there is only 1 wp
    if (ac.flightplan.length > 1) {
        let this_layergroup = 'Aircraft ' + ac.id;

        // remove the last wp from the list
        let wp = ac.flightplan.pop();

        // remove marker from map
        for (let item of layerControl._layers) {
            if (item.name == this_layergroup) {
                item.layer.removeLayer(wp.wpMarker);
            }
        }

        // Remove all rows from table
        let table = document.getElementById("ac_fp_table_" + ac.id);
        let rows = table.getElementsByClassName('fp_row');

        // don't remove last row
        if (rows.length > 1) {
            for (let i = rows.length - 1; i >= 0; --i) {
                rows[i].parentNode.removeChild(rows[i]);
            }
        }
        // Create rows in table based on new flight plan
        for (let i = 0; i < ac.flightplan.length; i++) {
            F.updateTable(table, ac.id, 'fp', i, E.clickAddRowButton, E.clickRemoveRowButton, [ac.flightplan[i].latlng.lat, ac.flightplan[i].latlng.lng], 1, ac.flightplan[i].alt);
        }
        DrawFlightPlan();
    }
}


// remove all aircraft info from layer when shudown is pressed
export function removeACShutdown(ac) {

    if (ac.flightplanLine != null) {
        removeMarkerFromLayer(ac.id, ac.flightplanLine)
        ac.flightplanLine.remove();
    }

    if (ac.replanLine != null) {
        removeMarkerFromLayer(ac.id, ac.replanLine)
        ac.replanLine.remove();
    }


    // remove wps
    for (let item of ac.flightplan) {
        removeMarkerFromLayer(ac.id, item.wpMarker);
    }
    ac.flightplan = []

    for (let item of ac.replan) {
        removeMarkerFromLayer(ac.id, item.wpMarker)
    }
    ac.replan = []

    if (ac.ditchSite) {
        removeMarkerFromLayer(ac.id, ac.ditchSite)
    }


    // remove ac and ic_radius
    if (ac.acMarker != 1) {
        // remove ac marker
        removeMarkerFromLayer(ac.id, ac.acMarker);
        // Remove circle
        if (ac.ic_radius) {
            removeMarkerFromLayer(ac.id, ac.ic_radius);
        }
    }

    //remove traffic
    if (ac.traffic_list.length > 0) {
        for (let i = ac.traffic_list.length - 1; i >= 0; i--) {
            removeMarkerFromLayer(ac.id, ac.traffic_list[i].marker)
        }
    }

    // remove the trailing dots (inFlight)
    for (let i = ac.prev_pos.length - 1; i >= 0; i--) {
        removeMarkerFromLayer(ac.id, ac.prev_pos[i])
    }

    // remove bands
    removeBands(ac)

    // remove gf
    if (ac.gf_list.length > 0) {
        for (let i = ac.gf_list.length - 1; i >= 0; i--) {
            if (ac.gf_list[i].fenceLine != null) {
                removeMarkerFromLayer(ac.id, ac.gf_list[i].fenceLine)
            }
            for (let item of ac.gf_list[i].point_list) {
                removeMarkerFromLayer(ac.id, item.marker)
            }
        }
    }

    try {
        if (ac.small) {
            removeMarkerFromLayer(ac.id, ac.small)
        }
        if (ac.med) {
            removeMarkerFromLayer(ac.id, ac.med)
        }
        if (ac.large) {
            removeMarkerFromLayer(ac.id, ac.large)
        }
    } catch (e) {
        console.log(e)
    }

    // remove the layer
    removeLayer('Aircraft ' + ac.id)
    DrawFlightPlan()
}


export function DrawFlightPlan() {
    // loops through all of the aircraft and re-draws all of the flight plans
    for (let ac of AM.getAircraftList()) {

        // redraw the ac icon
        if (ac.amMarker != 1) {
            removeMarkerFromLayer(ac.id, ac.acMarker);
        }
        if (AM.getActiveAc() && ac.id == AM.getActiveAc().id) {
            ac.icon = setAcIconRed(ac.id)
        } else {
            ac.icon = setAcIconBlue(ac.id)
        }
        ac.acMarker = new L.marker(L.latLng([ac.lat, ac.lng]), {
            icon: ac.icon,
            zIndexOffset: 1000,
            aircraft: ac.id
        })
        ac.acMarker.on('click', onAcClick);
        if (MODE.label) {
            ac.acMarker.bindTooltip('AC: ' + ac.name.toString(), {
                permanent: true,
                direction: 'right',
                offset: L.point(20, -10),
                className: 'myToolTip'
            })
        }
        addMarkerToLayer(ac.id, ac.acMarker);

        // check aircraft flightplanLine
        if (ac.flightplanLine != null) {
            removeMarkerFromLayer(ac.id, ac.flightplanLine)
            ac.flightplanLine = null;
        }

        let polyLineVertices = [];
        ac.flightplan.forEach(function (element) {
            if (element != 0) {
                polyLineVertices.push(element.latlng);
            }
        });


        // change color depending on ac
        if (polyLineVertices.length > 1) {
            let color;
            let a = AM.getActiveAc()
            if (a && a != 'Aircraft Not Found' && ac.id == AM.getActiveAc().id) {
                color = '#fa3535'
            } else {
                color = '#356dfa'
            }
            let dashArray;
            if (ac.status == 0) {
                dashArray = '10 15'
            } else if (ac.status == 1) {
                dashArray = '15 5'
            } else if (ac.status == 2) {
                dashArray = '1 1'
            } else if (ac.status == 3) {
                dashArray = '5 15'
            }
            ac.flightplanLine = L.polyline(polyLineVertices, {
                color: color,
                weight: 5,
                dashArray: dashArray
            })
            addMarkerToLayer(ac.id, ac.flightplanLine);
        }

        // check layer for old circles
        try {
            if (ac.small) {
                removeMarkerFromLayer(ac.id, ac.small)
            }
            if (ac.med) {
                removeMarkerFromLayer(ac.id, ac.med)
            }
            if (ac.large) {
                removeMarkerFromLayer(ac.id, ac.large)
            }
        } catch (e) {
            console.log('fail to remove circles', e)
        }

        let p2 = 0
        if (ac.mission_current != 0 && ac.flightplan.length > 1) {
            p2 = ac.flightplan[ac.mission_current - 1]

        }
        // console.log(p2)
        // wp2 circles for merging and spacing
        if (p2 != 0 && MODE.ring) {
            if (ac.entry_radius != 0) {
                ac.small = L.circle([p2.latlng.lat, p2.latlng.lng], {
                    color: 'red',
                    fillColor: 'green',
                    fillOpacity: 0.0,
                    radius: ac.entry_radius
                })
                addMarkerToLayer(ac.id, ac.small);
            }
            if (ac.schedule_zone != 0) {
                ac.med = L.circle([p2.latlng.lat, p2.latlng.lng], {
                    color: 'orange',
                    fillColor: 'green',
                    fillOpacity: 0.0,
                    radius: ac.schedule_zone
                })
                addMarkerToLayer(ac.id, ac.med);
            }
            if (ac.coord_zone != 0) {
                ac.large = L.circle([p2.latlng.lat, p2.latlng.lng], {
                    color: 'blue',
                    fillColor: 'green',
                    fillOpacity: 0.0,
                    radius: ac.coord_zone
                })
                addMarkerToLayer(ac.id, ac.large);
            }
        }
    }
}

export function DrawRePlan() {
    for (let ac of AM.getAircraftList()) {

        // check aircraft flightplanLine
        if (ac.replanLine != null) {
            removeMarkerFromLayer(ac.id, ac.replanLine)
            ac.replanLine = null;
        }

        let polyLineVertices = [];
        ac.replan.forEach(function (element) {
            if (element != 0) {
                polyLineVertices.push(element.latlng);
            }
        });

        // change color depending on ac
        if (polyLineVertices.length > 1) {
            let color;
            if (MapBox.line_color == 'default') {
                if (ac.id == AM.getActiveAc().id) {
                    color = '#fa3535'
                } else {
                    color = '#356dfa'
                }
            } else {
                color = MapBox.line_color
            }

            let dashArray = '7 7'

            ac.replanLine = L.polyline(polyLineVertices, {
                color: color,
                weight: 3,
                dashArray: dashArray
            })
            addMarkerToLayer(ac.id, ac.replanLine);
        }
    }
}


function onMapClick(e) {
    let ac = AM.getActiveAc()
    let marker = null;
    let id_list = [];
    let highlight_list = document.getElementsByClassName('highlight');
    let ac_id

    if (ac != null) {
        // check if active panel has a highlighted row
        for (let item of highlight_list) {
            id_list = item.id.split('_');
            ac_id = id_list[2]

            // only change value if active and not submitted to aircraft and is an ac
            if (ac.id == ac_id && ac.status == 0 && item.parentNode.parentNode.classList.contains('ac')) {

                // update the row value
                let row_num = id_list[id_list.length - 1];
                // get the current alt value in the box
                let alt = document.getElementById('ALT_fp_' + ac.id + '_' + row_num).value
                setRowValue(ac.id, 'fp', row_num, e.latlng.lat.toString(), e.latlng.lng.toString(), alt);

                // move marker from last position to new position
                marker = ac.flightplan[row_num]
                MoveWaypoint(e, marker);
            }
        }
    }
}


// updates wp values position
export function setRowValue(id_ac, type, row_num, lat, lng, alt) {
    // set the values for the inputs
    document.getElementById('LAT_' + type + '_' + id_ac + '_' + row_num).value = lat;
    document.getElementById('LNG_' + type + '_' + id_ac + '_' + row_num).value = lng;
    document.getElementById('ALT_' + type + '_' + id_ac + '_' + row_num).value = alt;

    let ac = AM.getAircraftById(id_ac);
    let wp = ac.flightplan[parseFloat(row_num)];
    //update the wp
    wp.latlng = new L.LatLng(lat, lng);
    // add wp to map
    let wpMarker = defineWPMarker(wp.latlng, ac.id)
}


// ac Icon not shown until messages are recieved
export function UpdatePosition(ac, lat, lng) {
    let position = [parseFloat(lat), parseFloat(lng)];
    let acMarkerPos = L.latLng(position);
    // move the old icon
    if (ac.acMarker != 1) {
        // removeMarkerFromLayer(ac.id, ac.acMarker);
        ac.acMarker.setLatLng(acMarkerPos)
        if (ac.icarous == 1 && ac.showBands && ac.ic_radius) {
            // Remove circle
            removeMarkerFromLayer(ac.id, ac.ic_radius);
        }
    } else {
        // add the new icon
        if (ac.icon == 1) {
            ac.icon = setAcIconRed(ac.id)
        }

        ac.acMarker = new L.marker(acMarkerPos, {
            icon: ac.icon,
            zIndexOffset: 1000,
            aircraft: ac.id
        })
        ac.acMarker.on('click', onAcClick);
        if (MODE.label) {
            ac.acMarker.bindTooltip('AC: ' + ac.name.toString(), {
                permanent: true,
                direction: 'right',
                offset: L.point(20, 2),
                className: 'myToolTip'
            })
        }
        addMarkerToLayer(ac.id, ac.acMarker);
    }


    if (ac.icarous == 1 && ac.showBands) {
        // add circle
        ac.ic_radius = L.circle([lat, lng], {
            color: 'gray',
            fillColor: 'gray',
            fillOpacity: 0.1,
            weight: 2,
            radius: ac.icRad
        })
        addMarkerToLayer(ac.id, ac.ic_radius)
    }

    // update dot previous position
    if (ac.pos_update_counter % 10 == 0) {
        let path_marker = L.circle([lat, lng], {
            color: 'orange',
            fillColor: 'orange',
            fillOpacity: 0.1,
            radius: .01
        })
        addMarkerToLayer(ac.id, path_marker)
        ac.prev_pos.push(path_marker)
        if (ac.prev_pos.length > 25) {
            removeMarkerFromLayer(ac.id, ac.prev_pos[0])
            ac.prev_pos.shift()
        }
    }
    ac.pos_update_counter += 1;

    //drawBands(ac)

    let start;
    let stop;
    removeBands(ac)
    if (ac.ic_control && ac.showBands) {
        let b = ac.bands.ic_bands.type
        let def = ac.bands.ic_bands.type_def
        for (let [type, ba] of Object.entries(b)) {
            // for now only drawing type 0
            if (type == 0) {
                for (let [b, v] of Object.entries(ba.bands)) {
                    if (def[b].color) {
                        for (let i = 0; i < v[0].length; i++) { // Far
                            start = v[0][i];
                            stop = v[1][i];
                            // add new band
                            let band = L.circleArc([ac.lat, ac.lng], {
                                radius: ac.icRad,
                                fill: false,
                                color: def[b].color,
                                opacity: 1,
                                dashArray: def[b].dash,
                                weight: 5,
                                startAngle: start,
                                stopAngle: stop,
                            })
                            addMarkerToLayer(ac.id, band)
                            ac.band_markers.push(band)
                        }
                    }
                }
            }
        }
    }
}


export function updateIcBands(ac) {
    // if timeout reached remove the bands
    if (ac.showBands) {
        if (Date.now() - ac.ic_last > 5000) {
            removeBands(ac)
        } else {
            // move the center of the band when ac position updates
            // get new position
            let newLatLng = new L.LatLng(ac.lat, ac.lng);
            // update position
            for (let item in ac.band_markers) {
                layerControl._layers[item]._latlng = newLatLng;
            }
        }
    }
}


export function removeBands(ac) {
    if (ac.showBands) {
        if (ac.band_markers.length > 0) {
            for (let item of ac.band_markers) {
                removeMarkerFromLayer(ac.id, item);
            }
            ac.band_markers = []
        }
    }
}


export function setS2Dsite(ac, lat, lng, alt) {
    if (ac.ditchSite) {
        removeMarkerFromLayer(ac.id, ac.ditchSite)
    }
    ac.ditchSite = L.circle([lat, lng], {
        color: 'blue',
        fillColor: 'blue',
        fillOpacity: 0.1,
        radius: ac.icRad * .5
    })
    console.log(ac.ditchSite)
    addMarkerToLayer(ac.id, ac.ditchSite)
}


/**
 * @function <a name="setAcIcon">setAcIcon</a>
 * @description Set's the aircraft icon image, size.
 * @param acId {string} aircraft id
 * @memberof module:Aircraft
 * @instance
 */
export function setAcIconBlue(acId) {
    let acIcon
    let ac = AM.getAircraftById(acId)
    acIcon = new L.icon({
        iconUrl: ac.acIconList[1],
        // shadowUrl: 'images/drone-svgrepo-com-green.svg',
        iconSize: [40, 40], // size of the icon
        // shadowSize: [36, 36], // size of the shadow
        // shadowAnchor: [17, 16], // the same for the shadow
        popupAnchor: [4, 62] // point from which the popup should open relative to the iconAnchor
    })
    return acIcon
}

/**
 * @function <a name="setAcIconWithShadow">setAcIconWithShadow</a>
 * @description Sets the aircraft icon with a red outline to denote active aircraft.
 * @param acId {string} aircraft id
 * @memberof module:Aircraft
 * @instance
 */
export function setAcIconRed(acId) {
    let acIcon
    let ac = AM.getAircraftById(acId)
    acIcon = new L.icon({
        iconUrl: ac.acIconList[0],
        //shadowUrl: 'images/drone-svgrepo-com-red.svg',
        iconSize: [40, 40], // size of the icon
        //shadowSize: [36, 36], // size of the shadow
        //shadowAnchor: [17, 16], // the same for the shadow
        popupAnchor: [4, 62] // point from which the popup should open relative to the iconAnchor
    })
    return acIcon
}