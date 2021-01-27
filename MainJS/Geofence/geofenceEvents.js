/**
 *
 * @module geofenceEvents
 * @version 1.0.0
 * @description <b> Library of Geofence event functions. </b>
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

import * as E from '../control/eventFunctions.js'
import * as S from '../control/saveFile.js'

import * as M from '../views/map.js'
import * as F from '../views/form.js'
import * as FM from '../models/formElements.js'

import * as G from './geofence.js'

/**
 * @function <a name="updateContextMenuGF">updateContextMenuGF</a>
 * @description Adds geofence options to the context menu.
 * @param none
 * @memberof module:geofenceEvents
 */
export function updateContextMenuGF() {
    let mymap = M.getMap()
    mymap.contextmenu.addItem({
        text: "Add Fence",
        callback: contextAddGF
    })
    mymap.contextmenu.addItem({
        text: 'Add Vertex',
        callback: contextAddPoint,
        disabled: true
    })
    mymap.contextmenu.addItem({
        separator: true
    })
}

/**
 * @function <a name="onMapClickGeofence">onMapClickGeofence</a>
 * @description Moves geofence vertex based on location of map click.
 * @param e {event}
 * @memberof module:geofenceEvents
 */
function onMapClickGeofence(e) {
    // click on gf marker
    let point;
    let ac;
    let f;
    let highlight_list = document.getElementsByClassName('highlight')

    for (let item of highlight_list) {
        if (item.parentNode.parentNode.classList.contains('geofence_table')) {
            let {
                ac_id,
                f_id,
                p_id
            } = getValuesFromRowId(item.id)
            ac = AM.getAircraftById(ac_id);
            f = G.getFenceById(f_id, ac)
            point = G.getPointById(p_id, f)

            // move marker from last position to new position
            G.moveMarker(e, point);

            // Update the cell values
            item.childNodes[1].childNodes[0].value = e.latlng.lat.toString();
            item.childNodes[2].childNodes[0].value = e.latlng.lng.toString();
        }
    }
}

/**
 * @function <a name="clickPointMarker">clickPointMarker</a>
 * @description Highlights the table row associated with a vertex marker and makes panel active. Markers have been removed so this is kind of useless.
 * @param none
 * @memberof module:geofenceEvents
 */
export function clickPointMarker() {
    let p_id = this.options.point
    let f_id = this.options.fence
    let ac_id = this.options.aircraft

    let ac = AM.getAircraftById(ac_id)
    let pan_id = `ac_geofence_pan_${f_id}_${ac_id}`

    // make gf and ac panel active
    F.makePanelActive(`ac_${ac.prev_panel}_${ac.id}`)
    G.makeGfPanelActive(pan_id)

    // highlight row associated with this marker
    F.removeHighlight()
    document.getElementById(`row_geofence_${ac_id}_${f_id}_${p_id}`).classList.add('highlight')
}

/**
 * @function <a name="contextAddGF">contextAddGF</a>
 * @description Adds new geofence when click add fence in context menu. Wrapper for addGF.
 * @param e {event}
 * @memberof module:geofenceEvents
 */
export function contextAddGF(e) {
    let lat = e.latlng.lat
    let lng = e.latlng.lng
    let center = [lat, lng]
    let ac = AM.getActiveAc()
    addGF(ac, center)
}

/**
 * @function <a name="clickAddGf">clickAddGf</a>
 * @description Adds new geofence when click add fence in panel. Wrapper for addGF.
 * @param none
 * @memberof module:geofenceEvents
 */
export function clickAddGf() {
    let ac = E.getACFromElementId(this.id);
    let center = M.getCenter()
    addGF(ac, center)
}

/**
 * @function <a name="addGf">addGf</a>
 * @description Adds new geofence, updates map, creates panels.
 * @param ac {Object} Aircraft Object
 * @param center {Array} [lat, lng]
 * @memberof module:geofenceEvents
 */
export function addGF(ac, center) {
    let ac_list = AM.getAircraftList()
    for (let item of ac_list) {
        if (item.gf_list.length == 0) {
            // update context menu
            let mymap = M.getMap()
            mymap.contextmenu.setDisabled(7, false)
        }
    }

    // adjust the form on window resize
    window.addEventListener('resize', resizeGFForm)

    // check map clicks for gf interactions
    let mymap = M.getMap()
    mymap.on('click', onMapClickGeofence)

    // define the fence
    let f_id = ac.gf_list.length
    if (ac.gf_list.length == 0) {
        f_id = 1
    } else {
        let id_list = []
        for (let i of ac.gf_list) {
            id_list.push(i.id)
        }
        let x = 0
        while (true) {
            x = x + 1
            if (!id_list.includes(x)) {
                f_id = x
                break
            }
        }
    }


    let fence = new G.Fence(f_id, ac.id)

    // define the start point
    let p_id = 0
    let point = new G.Point(p_id, ac.id, f_id, center[0], center[1]);

    // add the point to the fence, add the fence to the gf_list
    fence.addPoint(point)
    ac.gf_list.push(fence)

    // create and show the panel
    G.createGfPlanPanel(ac, f_id)
    G.createGfSummaryPanel()
    G.makeGfPanelActive(`ac_geofence_pan_${f_id}_${ac.id}`)

    // show the summary button
    if (MODE.mode != 'Playback') {
        let s_btn = document.getElementById(`gf_summary_pan_btn_${ac.id}`)
        s_btn.classList.replace('hide', 'show')
    }
}

/**
 * @function <a name="resizeForm">resizeForm</a>
 * @description Handles adjusting the panel elements when the window size changes.
 * @param none
 * @memberof module:geofenceEvents
 */
export function resizeGFForm() {
    let ac = AM.getActiveAc()
    if (ac != null) {
        // get active traffic panel
        let g_list = document.getElementsByClassName('geofence active')
        if (g_list.length > 0 && g_list[0].id != 'ac_geofence_summary' && g_list[0].id != 'loading_ac_sendgeofence') {
            // get the parent element
            let par = g_list[0]
            // get the table
            let id = par.id.split('_')
            let gf_id = id[id.length - 2]
            let table = document.getElementById(`ac_geofence_table_${gf_id}_${ac.id}`).parentNode
            let h = 0
            // get the sum of the heights of the children
            for (let item of par.childNodes) {
                h = h + item.clientHeight
            }
            // subtract the height of the form
            h = h - table.clientHeight
            // adjust the min/max height of the form to fit the remaining space in the panel
            table.style.maxHeight = `${(par.clientHeight - h - (par.clientHeight * .05))}px`
            table.style.minHeight = `${(par.clientHeight - h - (par.clientHeight * .05))}px`
        }
    }
}

/**
 * @function <a name="clickSubmitGf">clickSubmitGf</a>
 * @description Formats the message and submits the geofence to the aircraft.
 * @param none
 * @memberof module:geofenceEvents
 */
export function clickSubmitGf() {
    let id_list = this.id.split('_')
    let f_id = id_list[id_list.length - 2]
    let ac_id = id_list[id_list.length - 1]
    let ac = AM.getAircraftById(ac_id)
    let f = G.getFenceById(f_id, ac)

    if (f.seq == 0) {
        f.seq = 1
        for (let item of ac.gf_list) {
            if (item.seq >= f.seq && item.id != f.id) {
                f.seq = item.seq + 1
            }
        }
    }
    ac.gf_submitted.push(f)

    // build the message
    let message = `LOAD_GEOFENCE AC_ID ${ac.id} F_ID ${f.seq} TYPE ${f.type} FLOOR ${f.floor} ROOF ${f.roof}`

    if (!checkCounterClockwise(f.point_list)) {
        f.point_list = f.point_list.reverse()
    }

    for (let p of f.point_list) {
        message = `${message} ${p.lat} ${p.lng}`
    }

    C.sendMessage(message)
    f.submitted = true;
    G.updateFenceSummaryPanel()
    C.sendMessage(`REQUEST_FENCE ${ac.id}`)
}

function checkCounterClockwise(point_list) {
    let p1
    let p2
    let th
    let th_list = []
    for (let i = 0; i < point_list.length; i++) {
        p1 = point_list[i]
        if (i == point_list.length - 1) {
            p2 = point_list[0]
        } else {
            p2 = point_list[i + 1]
        }
        th = Math.atan2(p2.lng - p1.lng, p2.lat - p1.lat) * (180 / Math.PI)
        th_list.push(th)
    }
    let ch
    let t = 0
    for (let i = 0; i < th_list.length; i++) {
        p1 = th_list[i]
        if (i == th_list.length - 1) {
            p2 = th_list[0]
        } else {
            p2 = th_list[i + 1]
        }
        ch = p2 - p1
        if (ch > 0) {
            t = t + 1
        } else {
            t = t - 1
        }
    }
    if (t < 0) {
        return true
    } else {
        return false
    }
}

/**
 * @function <a name="contextRemoveFence">contextRemoveFence</a>
 * @description Click in context menu on remove Fence. Wrapper for removeGF.
 * @todo make sure this is actually an option in the context menu.
 * @param none
 * @memberof module:geofenceEvents
 */
export function contextRemoveFence() {
    let ac_id = this.contextmenu._showLocation.relatedTarget.options.aircraft
    let f_id = this.contextmenu._showLocation.relatedTarget.options.fence
    let ac = AM.getAircraftById(ac_id)
    let f = G.getFenceById(f_id, ac)
    let pan = document.getElementById(`ac_geofence_pan_${f.id}_${ac.id}`)
    removeGf(ac, f, pan)
}

/**
 * @function <a name="clickRemoveGf">clickRemoveGf</a>
 * @description Click in panel on remove Fence. Wrapper for removeGF.
 * @param none
 * @memberof module:geofenceEvents
 */
export function clickRemoveGf() {
    let id_list = this.id.split('_')
    let f_id = id_list[id_list.length - 2]
    let ac_id = id_list[id_list.length - 1]
    let ac = AM.getAircraftById(ac_id)
    let f = G.getFenceById(f_id, ac)
    let pan = document.getElementById(`ac_geofence_pan_${f.id}_${ac.id}`)
    removeGf(ac, f, pan)
}

/**
 * @function <a name="removeGf">removeGf</a>
 * @description Removes gf, clears map removes panels.
 * @param ac {object} Aircraft object
 * @param f {object} Fence object
 * @param pan {object} HTML Div
 * @memberof module:geofenceEvents
 */
export function removeGf(ac, f, pan) {
    // remove the panel
    FM.removeElement(pan)

    // remove all points from the map
    f.point_list.forEach(el => {
        G.removeGfMarker(ac.id, el.marker)
        f.point_list = []
    })

    // remove line from the map
    if (f.fenceLine != null) {
        G.removeGfMarker(ac.id, f.fenceLine)
        f.fenceLine = null
    }

    // remove the fence from ac
    ac.gf_list = ac.gf_list.filter(el => el.id != f.id)

    // remove the panel from ac.activeSubPanels
    G.clearSubpanelsFromList(ac)
    // redraw the lines
    G.drawGeofences()
    // update the summary panel
    G.updateFenceSummaryPanel()
}

/**
 * @function <a name="enterLoadFence">enterLoadFence</a>
 * @description Listens for user to press enter then sends load geofence file message.
 * @param e {event}
 * @memberof module:geofenceEvents
 */
export function enterLoadFence(e) {
    if (e.key == 'Enter') {
        C.sendMessage(`LOAD_GF_FILE ${e.srcElement.value}`)
    }
}

export function clickLoadFence() {
    let m
    let point
    let points = []
    let lat
    let lng
    let id
    let num
    let type
    let floor
    let roof
    let fence
    let fences = []
    let ac = AM.getActiveAc()

    // load the file
    let fr = new FileReader()

    fr.onload = function (e) {
        let text = fr.result
        let parser = new DOMParser()
        let doc = parser.parseFromString(text, 'text/xml')
        let f = doc.getElementsByTagName('fence')

        for (let item of f) {
            id = item.id
            for (let i of item.childNodes) {
                if (i.tagName == 'type') {
                    type = i.innerHTML
                } else if (i.tagName == 'num_vertices') {
                    num = i.innerHTML
                } else if (i.tagName == 'floor') {
                    floor = i.innerHTML
                } else if (i.tagName == 'roof') {
                    roof = i.innerHTML
                } else if (i.tagName == 'vertex') {
                    for (let j of i.childNodes) {
                        if (j.tagName == 'lat') {
                            lat = j.innerHTML
                        } else if (j.tagName == 'lon') {
                            lng = j.innerHTML
                        }
                    }
                    point = [lat, lng]
                    points.push(point)
                }
            }

            fence = {
                'id': id,
                'numV': num,
                'Vertices': points,
                'floor': floor,
                'roof': roof,
                'type': type
            }

            fences.push(fence)
            points = []
        }

        m = {
            "AIRCRAFT": ac.id,
            "FILE": "True",
            "LIST": fences,
            "TYPE": "GF",
        }
        // console.log(m)
        gfInMessage(m, ac)
    }

    fr.readAsText(this.files[0])
    document.getElementById(this.id).value = ''
}


/**
 * @function <a name="enterSaveFence">enterSaveFence</a>
 * @description Listens for the user to press enter then calls save_geofences from the save module
 * @param e {event}
 * @memberof module:geofenceEvents
 */
export function enterSaveFence(e) {
    if (e.key == 'Enter') {
        let filename = e.target.value
        let id_list = e.target.id.split('_')
        let ac = AM.getAircraftById(id_list[3])
        let f = G.getFenceById(id_list[2], ac)
        let data = [parseInt(f.id) - 1, f.type, f.point_list.length, f.floor, f.roof]
        for (let item of f.point_list) {
            data = data.concat([item.id, item.lat, item.lng])
        }
        console.log(data)
        S.save_geofences(ac, filename, data)

    }
}

/**
 * @function <a name="clickShowGfSummary">clickShowGfSummary</a>
 * @description Click button in panel to show or hide geofence summary panel
 * @todo this doesn't work well, need to fix
 * @param none
 * @memberof module:geofenceEvents
 */
export function clickShowGfSummary() {
    let id_list = this.id.split('_')
    let id = id_list[id_list.length - 1]
    let ac = AM.getAircraftById(id)
    let btn = document.getElementById(this.id)

    // hide any active gf panels
    G.clearSubpanelsFromList(ac)

    if (btn.innerHTML == 'Show Geofence Summary') {
        ac.activeSubPanels.push('ac_geofence_summary')

        // hide the show button
        btn.classList.replace('show', 'hide')

        // show the hide button
        let h_btn_in = document.getElementById(`gf_summary_hide_${ac.prev_panel}_btn_${id}`)
        h_btn_in.classList.replace('hide', 'show')

    } else if (btn.innerHTML == 'Hide GeoFence Panel') {
        // hide the show button
        btn.classList.replace('show', 'hide')

        // show the show button
        let s_btn_in = document.getElementById(`gf_summary_${ac.prev_panel}_btn_${id}`)
        s_btn_in.classList.replace('hide', 'show')
    }
    // refresh the main panel
    F.makePanelActive(`ac_${ac.prev_panel}_${ac.id}`)
}

/**
 * @function <a name="inputFloor">inputFloor</a>
 * @description Updates floor value as the value is typed in the box.
 * @todo Probably not needed
 * @param e {event}
 * @memberof module:geofenceEvents
 */
export function inputFloor(e) {
    let floor = e.path[0].value
    let id_list = e.path[0].id.split('_')
    let ac_id = id_list[id_list.length - 1]
    let f_id = id_list[id_list.length - 2]
    let f = G.getFenceById(f_id, AM.getAircraftById(ac_id))
    f.floor = floor
}

/**
 * @function <a name="inputRoof">inputRoof</a>
 * @description Updates roof value as the value is typed in the box
 * @todo Probably not needed
 * @param e {event}
 * @memberof module:geofenceEvents
 */
export function inputRoof(e) {
    let roof = e.path[0].value
    let id_list = e.path[0].id.split('_')
    let ac_id = id_list[id_list.length - 1]
    let f_id = id_list[id_list.length - 2]
    let f = G.getFenceById(f_id, AM.getAircraftById(ac_id))
    f.roof = roof
}

/**
 * @function <a name="toggleGFType">toggleGFType</a>
 * @description Listens for a click then updates the toggle highlight for Include/Exclude buttons, and updates the fence.
 * @param none
 * @memberof module:geofenceEvents
 */
export function toggleGFType() {
    let id_list = this.id.split('_')
    let ac = AM.getAircraftById(id_list[id_list.length - 2])
    let f = G.getFenceById(id_list[id_list.length - 3], ac)

    let here_ = false;
    let on = document.getElementById(`include_${f.id}_${ac.id}_on`)
    let off = document.getElementById(`include_${f.id}_${ac.id}_off`)
    on.classList.forEach(function (item) {
        if (item == 'highlight_f') {
            on.classList.remove('highlight_f');
            off.classList.add('highlight_f');
            f.type = 1;
            here_ = true;
        }
    });
    if (here_) {
        return;
    };

    off.classList.forEach(function (item) {
        if (item == 'highlight_f') {
            off.classList.remove('highlight_f');
            on.classList.add('highlight_f');
            f.type = 0;
        }
    });
}

/**
 * @function <a name="contextAddPoint">contextAddPoint</a>
 * @description Click add vertex in context menu, adds point to geofence based on click position. Wrapper for addRow
 * @param e {event}
 * @memberof module:geofenceEvents
 */
export function contextAddPoint(e) {
    let lat = e.latlng.lat
    let lng = e.latlng.lng
    let center = [lat, lng]
    let ac = AM.getActiveAc()
    let f = G.getActiveFence(ac)
    if (f != 'Fence Not Found') {
        let row = document.getElementById(`row_geofence_${ac.id}_${f.id}_${f.point_list.length - 1}`)
        addRow(ac, center, row)
    } else {
        console.log(f)
    }
}

/**
 * @function <a name="clickAddRow">clickAddRow</a>addRow
 * @description Click '+' in table, adds point to geofence based on center of map. Wrapper for addRow.
 * @param none
 * @memberof module:geofenceEvents
 */
export function clickAddRow() {
    let center = M.getCenter()
    let add_btn = document.getElementById(this.id)
    let row = add_btn.parentNode.parentNode
    let ac = AM.getActiveAc()
    addRow(ac, center, row)
}

/**
 * @function <a name="">addRow</a>
 * @description Adds a row to the table, updates map, updates fence, highlights row.
 * @param ac {Object} Aircraft Object
 * @param center {Array} [lat, lng]
 * @param row {Object} HTML Div, Optional
 * @param p {string} row id, Optional
 * @memberof module:geofenceEvents
 */
export function addRow(ac, center, row = null, p = null) {
    let row_id
    let table

    if (row != null) {
        row_id = row.id
    } else if (p != null) {
        row_id = p
    } else {
        console.log('you suck')
        return
    }

    let {
        ac_id,
        f_id,
        p_id
    } = getValuesFromRowId(row_id)
    let row_num = parseInt(p_id) + 1

    if (row != null) {
        table = row.parentNode.parentNode
    } else if (p != null) {
        table = document.getElementById(`ac_geofence_table_${f_id}_${ac.id}`)
    } else {
        console.log('you suck')
        return
    }

    // add new point to gf
    let point = new G.Point(row_num, ac_id, f_id, center[0], center[1])
    let fence = G.getFenceById(f_id, ac)
    fence.addPoint(point)

    // add point to map
    // G.addGfToLayer(ac.id, point.marker)

    // draw the fence
    G.drawGeofences()

    // add row to table
    let new_row = F.addRowToTable(`${ac_id}_${f_id}`, 'geofence', row_num, clickAddRow, clickRemoveRow, center, 0);
    new_row.setAttribute('id', `row_geofence_${ac_id}_${f_id}_${row_num}`)
    table.firstChild.appendChild(new_row)

    // make sure row values are set correctly
    setGfRowValues(ac, fence)

    // highlight the row
    F.removeHighlight()
    document.getElementById(`row_geofence_${ac_id}_${f_id}_${row_num}`).classList.add('highlight')
}

/**
 * @function <a name="contextRemoveRow">contextRemoveRow</a>
 * @description Click remove vertex in context menu removes point fromw geofence. Wrapper for removeRow
 * @todo Not sure this is a thing without vertex markers
 * @param none
 * @memberof module:geofenceEvents
 */
export function contextRemoveRow() {
    let ac_id = this.contextmenu._showLocation.relatedTarget.options.aircraft
    let f_id = this.contextmenu._showLocation.relatedTarget.options.fence
    let p_id = this.contextmenu._showLocation.relatedTarget.options.point
    let ac = AM.getAircraftById(ac_id)
    let f = G.getFenceById(f_id, ac)
    let p = G.getPointById(p_id, f)
    removeRow(ac, f, p)
}

/**
 * @function <a name="clickRemoveRow">clickRemoveRow</a>
 * @description Click '-' removes point from geofence. Wrapper for removeRow
 * @param none
 * @memberof module:geofenceEvents
 */
export function clickRemoveRow() {
    let {
        ac_id,
        f_id,
        p_id
    } = getValuesFromRowId(this.id)
    let ac = AM.getAircraftById(ac_id)
    let f = G.getFenceById(f_id, ac)
    let p = G.getPointById(p_id, f)
    removeRow(ac, f, p)
}

/**
 * @function <a name="removeRow">removeRow</a>
 * @description Removes row from table, point from fence, updates panels, updata map.
 * @param ac {Object} Aircraft object
 * @param f {Object} Fence object
 * @param p {Object} Point object
 * @memberof module:geofenceEvents
 */
export function removeRow(ac, f, p) {
    // if this is the only point do nothing
    if (f.point_list.length > 1) {

        // remove marker
        G.removeGfMarker(ac.id, p.marker)

        //remove point from fence
        f.point_list = f.point_list.filter(el => el.id != p.id)

        // Remove all rows from table
        let table = document.getElementById(`ac_geofence_table_${f.id}_${ac.id}`)
        let rows = table.getElementsByClassName('fp_row')

        if (rows.length > 1) {
            for (let i = rows.length - 1; i >= 0; i--) {
                FM.removeElement(rows[i])
            }
        }
        rows = table.getElementsByClassName('fp_row')

        // create new rows
        f.point_list.forEach((el, ind) => {
            el.id = ind
            el.marker.options.point = ind
            F.updateTable(table, `${el.ac_id}_${el.f_id}`, 'geofence', ind, clickAddRow, clickRemoveRow)
        });
        // make sure row values are set correctly
        setGfRowValues(ac, f)
    }

    // redraw lines
    G.drawGeofences()
}

/**
 * @function <a name="setGfRowValues">setGfRowValues/a>
 * @description matches point lat,lng to value displayed in table
 * @param ac {Object} Aircraft object
 * @param f {Object} Fence object
 * @memberof module:geofenceEvents
 */
export function setGfRowValues(ac, f) {
    f.point_list.forEach((el, ind) => {
        // set lat lng values
        let la = document.getElementById(`LAT_geofence_${ac.id}_${f.id}_${el.id}`)
        let ln = document.getElementById(`LNG_geofence_${ac.id}_${f.id}_${ el.id}`)
        la.value = el.lat
        ln.value = el.lng
    });
}

/**
 * @function <a name="contextAddPoint">contextAddPoint</a>
 * @description helper function to get id's from html object id's
 * @param row_id {string}
 * @returns {Object} {string, string, string}
 * @memberof module:geofenceEvents
 */
export function getValuesFromRowId(row_id) {
    let r = row_id.split('_')
    let ac_id = r[r.length - 3]
    let f_id = r[r.length - 2]
    let p_id = r[r.length - 1]
    return {
        ac_id,
        f_id,
        p_id
    }
}


export function gfInMessage(m, ac) {
    if (m.FILE == 'True') {
        let fence = G.getActiveFence(ac)
        // console.log(fence)
        let pan = document.getElementById(`ac_geofence_pan_${fence.id}_${ac.id}`)
        if (pan != null) {
            // console.log(fence.id)
            FE.removeGf(ac, fence, pan)
        }
    }

    // remove all geofences from the map
    for (let ac of AM.aircraft_list) {
        for (let f of ac.gf_list) {
            if (f.fenceLine != null) {
                G.removeGfMarker(ac.id, f.fenceLine)
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
            d = G.getFenceBySeq(i.id, ac)
            if (d != 'GeoFence not found') {
                removeGf(ac, d, document.getElementById(`ac_geofence_pan_${d.id}_${ac.id}`))
            }
        }
        addGF(ac, i.Vertices[0])
        f = ac.gf_list[ac.gf_list.length - 1]
        f.type = i.type
        n = i.numV
        f.floor = i.floor
        f.roof = i.roof

        // add the verticies
        for (let x = 1; x < n; x++) {
            center = i.Vertices[x]
            row = `row_geofence_${ac.id}_${f.id}_${x - 1}`
            // console.log(x)
            addRow(ac, center, null, row)
        }
        if (m.FILE == 'False') {
            f.submitted = true
            f.seq = i.id
            // should not have planning panel
            FM.removeElement(document.getElementById(`ac_geofence_pan_${f.id}_${ac.id}`))
            G.clearSubpanelsFromList(ac)

        } else {
            // make sure floor and roof inputs are updated
            let floor = document.getElementById(`gf_floor_GF Floor_${f.id}_${ac.id}`)
            let roof = document.getElementById(`gf_roof_GF Roof_${f.id}_${ac.id}`)
            floor.value = f.floor
            roof.value = f.roof
            // make sure inc/exc toggle is updated
            let inc = document.getElementById(`include_${f.id}_${ac.id}_on`)
            let exc = document.getElementById(`include_${f.id}_${ac.id}_off`)
            if (f.type == 0) {
                inc.classList.add('highlight_f')
                exc.classList.remove('highlight_f')
            } else {
                exc.classList.add('highlight_f')
                inc.classList.remove('highlight_f')
            }
        }
    }

    // update the map with lines
    G.drawGeofences()
    G.updateFenceSummaryPanel()
    // make the correct panel active
    F.makePanelActive(`ac_pan_${ac.id}`)
    // Re draw the flight plan
    M.DrawFlightPlan();
}
