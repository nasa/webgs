/**
 *
 * @module GeoFence
 * @version 1.0.1
 * @description <b> Geofence module </b>
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

import * as E from '../control/eventFunctions.js';

import * as map from '../views/map.js';
import * as form from '../views/form.js';
import * as FM from '../models/formElements.js'

import * as GE from './geofenceEvents.js'


export class Fence {
    /**
     * @function <a name="Fence">Fence</a>
     * @description Constructor.
     * @param id {string} fence id
     * @param ac_id {string} aircraft id
     * @memberof module:GeoFence
     * @class Fence
     * @instance
     */
    constructor(id, ac_id) {
        this.id = id;
        this.ac_id = ac_id;
        this.point_list = [];
        this.fenceLine = null;
        this.submitted = false;
        this.submittedId = null
        this.seq = 0
        this.type = 1; // 0=include (vehicle stays in), 1=exclude (vehicle stays out)
        this.floor = -5;
        this.roof = 100;
    }

    /**
     * @function <a name="addPoint">removePoint</a>
     * @description adds a point to the point list, redraws the fence
     * @param point {Object} Point object
     * @memberof module:GeoFence
     * @class Fence
     * @instance
     */
    addPoint(point) {
        this.point_list.push(point)
        drawGeofences()
    }

    /**
     * @function <a name="removePoint">removePoint</a>
     * @description removes a point from the point list, redraws the fence
     * @param point {Object} Point Object
     * @memberof module:GeoFence
     * @class Fence
     * @instance
     */
    removePoint(point) {
        let ind_list = this.point_list.filter((el, ind) => {
            if (el.id == point.id) {
                return ind
            }
        })
        this.point_list.splice(ind_list[0], 1)
        drawGeofences()
    }
}


export class Point {
    /**
     * @function <a name="Point">Point</a>
     * @description Constructor.
     * @param id {string} fence id
     * @param ac_id {string} aircraft id
     * @param f_id {string} fence id
     * @param lat {string} lat
     * @param lng {string} lng
     * @memberof module:GeoFence
     * @class Fence
     * @instance
     */
    constructor(id, ac_id, f_id, lat, lng) {
        this.id = parseInt(id);
        this.ac_id = parseInt(ac_id);
        this.f_id = parseInt(f_id);
        this.lat = parseFloat(lat);
        this.lng = parseFloat(lng);
        this.marker = this.definePointMarker();

    }

    /**
     * @function <a name="definePointMarker">definePointMarker</a>
     * @description defines the point marker for use with leaflet
     * @todo Not currently beeing used
     * @param none
     * @returns {Object.<L.marker>} leaflet marker
     * @memberof module:GeoFence
     * @class Fence
     * @instance
     */
    definePointMarker() {
        let position = new L.LatLng(this.lat, this.lng)
        let pointMarker = new L.marker(position, {
            aircraft: this.ac_id,
            fence: this.f_id,
            point: this.id,
            contextmenu: true,
            icon: black_marker,
            contextmenuItems: [{
                text: 'Remove Vertex',
                callback: GE.contextRemoveRow
            }, {
                separator: true
            }, {
                text: 'Remove Fence',
                callback: GE.contextRemoveFence
            }],
            contextmenuInheritItems: false
        })

        pointMarker.on('click', GE.clickPointMarker);
        return pointMarker;
    }
}


// need more icons should match color of ac
let black_marker = L.icon({
    iconUrl: './ManJS/Geofence/images/plus-square-button-svgrepo-com.svg',
    shadowUrl: '',
    iconSize: [14, 14], // size of the icon
    iconAnchor: [7, 7],
    shadowSize: [50, 64], // size of the shadow
    shadowAnchor: [4, 62], // the same for the shadow
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

/**
 * @function <a name="addFence">addFence</a>
 * @description Adds fence object to aircraft gf_list.
 * @param ac_id {string} Aircraft id.
 * @param fence {Object} Fence object
 * @memberof module:GeoFence
 */
export function addFence(ac_id, fence) {
    let ac = AM.getAircraftById(ac_id)
    ac.gf_list.push(fence)
}

/**
 * @function <a name="removeFence">removeFence</a>
 * @description Removes fence object from aircraft gf_list.
 * @param ac {Object} Aircraft object.
 * @param fence {Object} Fence object
 * @memberof module:GeoFence
 */
export function removeFence(ac, fence) {
    let ind_list = this.gf_list.filter((el, ind) => {
        if (el.id == fence.id) {
            return ind
        }
    })
    this.gf_list.splice(ind_list[0], 1)
}

/**
 * @function <a name="getFenceById">getFenceById</a>
 * @description Helper function to get fence object from fence id
 * @param f_id {string} Fence id
 * @param ac {Object} Aircraft Object
 * @returns {Object|string} fence object or 'GeoFence not Found'
 * @memberof module:GeoFence
 */
export function getFenceById(f_id, ac) {
    let f = ac.gf_list.filter(function (el) {
        return el.id == f_id
    })
    if (f.length > 0) {
        return f[0]
    } else {
        return 'GeoFence not found'
    }
}

/**
 * @function <a name="getFenceById">getFenceById</a>
 * @description Helper function to get fence object from fence seq#
 * @param seq {string} sequence number
 * @param ac {Object} Aircraft Object
 * @returns {Object|string} fence object or 'GeoFence not Found'
 * @memberof module:GeoFence
 */
export function getFenceBySeq(seq, ac) {
    let f = ac.gf_list.filter(function (el) {
        return el.seq == seq
    })
    if (f.length > 0) {
        return f[0]
    } else {
        return 'GeoFence not found'
    }
}

/**
 * @function <a name="getActiveFence">getActiveFence</a>
 * @description Helper function, Returns currently selected fence
 * @param ac {Object} Aircraft object.
 * @returns {Object|string} fence object or 'Fence Not Found'
 * @memberof module:GeoFence
 */
export function getActiveFence(ac) {
    let f;
    for (let item of ac.activeSubPanels) {
        if (item.includes('geofence_pan')) {
            let id = item.split('_')
            let f_id = id[id.length - 2]
            f = getFenceById(f_id, ac)
            return f
        }
    }
    return 'Fence Not Found'
}

/**
 * @function <a name="getPointById">getPointById</a>
 * @description Helper function, Returns point
 * @param p_id {string} point id
 * @param f {Object} Fence Object
 * @returns {Object|string} Point object or 'Point Not Found'
 * @memberof module:GeoFence
 */
export function getPointById(p_id, f) {
    let p = f.point_list.filter(function (el) {
        return el.id == p_id
    })
    if (p.length > 0) {
        return p[0]
    } else {
        return 'Point not found'
    }
}

/**
 * @function <a name="addGfButtons">addGfButtons</a>
 * @description returns buttons for ac panel to show/hide gf summary and add new gf
 * @param btn_div {Object} HTML Div
 * @params ac_id {string} Aircraft id
 * @params f_id {string} Fence id
 * @returns {Object} HTML Div
 * @memberof module:GeoFence
 */
export function addGfButtons(btn_div, ac_id, f_id) {
    // add Gf button
    btn_div.appendChild(FM.addBlockButton(ac_id, 'fence', 'Add GeoFence', GE.clickAddGf))

    // show Gf summary button
    createGfSummaryPanel()
    btn_div.appendChild(FM.addBlockButton(ac_id, `gf_summary_${f_id}`, 'Show Geofence Summary', GE.clickShowGfSummary))
    let s_btn = btn_div.lastChild.lastChild
    s_btn.classList.add('show')

    // hide Gf summary button
    btn_div.appendChild(FM.addBlockButton(ac_id, `gf_summary_hide_${f_id}`, 'Hide GeoFence Panel', GE.clickShowGfSummary))
    let h_btn = btn_div.lastChild.lastChild
    h_btn.classList.add('hide')

    // return btn_div
    return btn_div
}

/**
 * @function <a name="createGfSummaryPanel">createGfSummaryPanel</a>
 * @description Creates a div and adds it to the dom
 * @param none
 * @memberof module:GeoFence
 */
export function createGfSummaryPanel() {
    // if already exists don't create a new one
    if (document.getElementById('ac_geofence_summary') == null) {
        // create the panel
        let option_div = document.getElementById('option_div')
        option_div.appendChild(FM.addDiv('ac_geofence_summary','panel-body wrapper geofence hide sub'))
    }
    // add the info
    updateFenceSummaryPanel()
}


/**
 * @function <a name="updateFenceSummaryPanel">updateFenceSummaryPanel</a>
 * @description Updates the summary panel info
 * @param none
 * @memberof module:GeoFence
 */
export function updateFenceSummaryPanel() {
    // get the summary panel
    let pan = document.getElementById('ac_geofence_summary')
    FM.removeChildren(pan)

    // add the new info
    let title = FM.addHFive('gf_sum','GF Summary')

    let ul = FM.addUnorderedList('gf_sum_list','gf_summary_list')
    let li;
    let stuff;
    for (let ac of AM.getAircraftList()) {
        for (let i of ac.gf_list) {
            li = document.createElement('li')

            stuff = `AC: ${ac.name} GF: ${i.id} Type: ${i.type} <br />
                Fence loaded on aircraft: ${i.submitted}`

            li.appendChild(FM.addParagraph('', stuff, 'f_p'))

            if (!i.submitted) {
                // add edit gf button
                let edit_btn = FM.addBlockButton(`${i.id}_${ac.id}`, 'edit', 'edit', function (e) {
                    i.submitted = false
                    makeGfPanelActive(`ac_geofence_pan_${i.id}_${ac.id}`)
                })
                edit_btn.firstChild.innerHTML = '<img src="../MainJS/Geofence/images/Edit-01.svg" />'
                edit_btn.setAttribute('class', 'f_-')
                li.appendChild(edit_btn)
            }
            // add remove gf button
            let btn = FM.addBlockButton(`${i.id}_${ac.id}`, '-', '-', GE.clickRemoveGf)
            btn.setAttribute('class', 'f_-')
            li.appendChild(btn)

            // add li to the list
            ul.appendChild(li)
        }
        // add the list to the pan
        pan.appendChild(title)
        pan.appendChild(ul)
    }
}

/**
 * @function <a name="createGfPlanPanel">createGfPlanPanel</a>
 * @description Creates gefeonce planning panel
 * @param ac {Object} Aircraft Object
 * @param f_id {string} Fence id
 * @memberof module:GeoFence
 */
export function createGfPlanPanel(ac, f_id) {
    let f = getFenceById(f_id, ac)
    // get option_div
    let option_div = document.getElementById('option_div')

    // add panel
    let ac_pan_div = FM.addDiv( `ac_geofence_pan_${f_id}_${ac.id}`, 'panel-body wrapper geofence hide sub')
    option_div.appendChild(ac_pan_div)

    // add label
    ac_pan_div.appendChild(FM.addHFive('',` GeoFence: ${f_id}`))

    // add inputs
    let in_div = FM.addDiv('gf_input_div')
    ac_pan_div.appendChild(in_div)

    in_div.appendChild(FM.addNumberInput(`${f_id}_${ac.id}`, 'gf_floor', 'GF Floor', 1, 6, f.floor, GE.inputFloor))
    in_div.appendChild(FM.addNumberInput(`${f_id}_${ac.id}`, 'gf_roof', 'GF Roof', 1, 6, f.roof, GE.inputRoof))
    in_div.appendChild(FM.addButtonSwitch(`include_${f_id}_${ac.id}`, 'Include/Exclude', GE.toggleGFType))

    // highlight the correct button
    let inc = document.getElementById(`include_${f_id}_${ac.id}_on`)
    let exc = document.getElementById(`include_${f_id}_${ac.id}_off`)
    if (f.type == 0) {
        inc.classList.add('highlight_f')
        exc.classList.remove('highlight_f')
    } else {
        exc.classList.add('highlight_f')
        inc.classList.remove('highlight_f')
    }

    // add form
    createGfTable(ac, f_id)

    // create div for btns
    let btn_div = FM.addDiv('','g_btndiv')
    btn_div.appendChild(FM.addFileLoadButton(f.id, `gf_file_${ac.id}_`, "Load GF File", GE.clickLoadFence))
    btn_div.appendChild(FM.addTextInput(`gf_file_${f_id}_${ac.id}`, "Save GF To File", MODE.save_gf_default, GE.enterSaveFence))
    btn_div.appendChild(FM.addBlockButton(`${f_id}_${ac.id}`, 'submit_geofence', 'Submit Geofence', GE.clickSubmitGf))
    btn_div.appendChild(FM.addBlockButton(`${f_id}_${ac.id}`, 'remove_geofence', 'Remove Geofence', GE.clickRemoveGf))

    ac_pan_div.appendChild(btn_div)
}


/**
 * @function <a name="createGfTable">createGfTable</a>
 * @description Creates a table and adds it to the panel
 * @param ac {Object} Aircraft Object
 * @param f_id {string} fence id
 * @memberof module:GeoFence
 */
export function createGfTable(ac, f_id) {
    // build the table
    let table = FM.addTable(`ac_geofence_table_${f_id}_${ac.id}`,'table geofence_table')

    let div = FM.addDiv('','fence_plan')
    div.appendChild(table)

    document.getElementById(`ac_geofence_pan_${f_id}_${ac.id}`).appendChild(div);

    let header = table.createTHead();
    let rowh = header.insertRow(0);
    let cols = ['ID', 'LAT', 'LNG', '', ''];

    // insert elements into header
    for (let i = 0; i < cols.length; i++) {
        let cell_head = rowh.insertCell();
        cell_head.innerHTML = cols[i];
    }

    let row_num = 0;
    let f = getFenceById(f_id, ac)
    let p = f.point_list[0]
    let new_row = form.addRowToTable(`${ac.id}_${f_id}`, 'geofence', row_num, GE.clickAddRow, GE.clickRemoveRow, [p.lat, p.lng], 0);

    // append the row to the table
    table.firstChild.appendChild(new_row)

    // highlight selected row
    table.addEventListener('click', E.clickTable);

}

/**
 * @function <a name="makeGfPanelActive">makeGfPanelActive</a>
 * @description Removes other gf subpanels from ac active list, make this one active, makes ac active
 * @param pan_id {string} id of panel to make active
 * @memberof module:GeoFence
 */
export function makeGfPanelActive(pan_id) {
    let ac;
    let id;
    let f_id
    let id_list;
    if (pan_id.includes('summary') || pan_id.includes('loading')) {
        ac = AM.getActiveAc();
        if (ac == null) {
            console.log('how is this possible?')
        }
    } else {
        id_list = pan_id.split('_')
        id = id_list[id_list.length - 1]
        ac = AM.getAircraftById(id)
        f_id = id_list[id_list.length - 2]
    }

    // clear all highlighted rows
    form.removeHighlight()

    // update the ac
    clearSubpanelsFromList(ac)
    ac.activeSubPanels.push(pan_id)

    // update the map
    drawGeofences()

    // update the summary info
    updateFenceSummaryPanel()

    // refresh the form
    form.makePanelActive(`ac_${ac.prev_panel}_${ac.id}`)
}

/**
 * @function <a name="clearSubpanelsFromList">clearSubpanelsFromList</a>
 * @description Removes any geofence panels from the aircraft list
 * @param ac {Object} Aircraft Object
 * @memberof module:GeoFence
 */
export function clearSubpanelsFromList(ac) {
    for (let item of ac.activeSubPanels) {
        if (item.includes('geofence')) {
            ac.activeSubPanels.splice(ac.activeSubPanels.indexOf(item), 1)
        }
    }
}



// *******************************************************************
// map stuff

/**
 * @function <a name="addGfTolayer">addGfTolayer</a>
 * @description puts gf marker on map, wrapper for map.addMarkerToLayer
 * @param id {string} layer id (aircraft id)
 * @param wp {Object} L.marker
 * @memberof module:GeoFence
 */
export function addGfToLayer(id, wp) {
    map.addMarkerToLayer(id, wp)
}

/**
 * @function <a name="removeGfMarker">removeGfMarker</a>
 * @description removes gf marker from map, wrapper for map.removeMarkerFromLayer
 * @param id {string} layer id (aircraft id)
 * @param wp {Object} L.marker
 * @memberof module:GeoFence
 */
export function removeGfMarker(id, marker) {
    map.removeMarkerFromLayer(id, marker)
}

/**
 * @function <a name="moveMarker">moveMarker</a>
 * @description moves a marker already on map, redraws fence
 * @param e {event} event
 * @param point {Object} Point Object
 * @memberof module:GeoFence
 */
export function moveMarker(e, point) {
    // get new position
    let newLatLng = new L.LatLng(e.latlng.lat, e.latlng.lng)
    // update position
    point.marker.setLatLng(newLatLng)
    point.lat = e.latlng.lat
    point.lng = e.latlng.lng
    drawGeofences()
}

/**
 * @function <a name="drawGeofences">drawGeofences</a>
 * @description Redraws all of the geofences on the map
 * @param none
 * @memberof module:GeoFence
 */
export function drawGeofences() {
    // draw all fences for all ac
    for (let ac of AM.getAircraftList()) {
        for (let fence of ac.gf_list) {
            if (fence.fenceLine != null) {
                removeGfMarker(ac.id, fence.fenceLine)
                fence.fenceLine = null
            }

            // add points to the polygon
            let line = [];
            fence.point_list.forEach(el => {
                if (el != 0) {
                    line.push(el.marker._latlng)
                }
            });

            // add the first point as last point to close the loop
            line.push(fence.point_list[0].marker._latlng)


            let color = 'orange'
            let a = AM.getActiveAc()
            if (ac && a && ac.id == a.id) {
                color = '#fa3535'
            } else {
                color = '#356dfa'
            }

            let dashArray
            if (fence.submitted) {
                dashArray = '1 1'
                if (fence.type == 1) {
                    dashArray = '10 10'
                }
            } else {
                dashArray = '15 10'
            }
            // draw the line
            if (line.length > 2) {
                fence.fenceLine = L.polyline(line, {
                    color: color,
                    weight: 4,
                    dashArray: dashArray
                })
                addGfToLayer(ac.id, fence.fenceLine)
            }
        }
    }
}
