/**
 *
 * @module form
 * @version 1.0.1
 * @description <b> Library of panel layout control functions. </b>
 *  Updated Aug. 21 2019 -apeters
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

import * as FM from '../models/formElements.js'

import * as E from '../control/eventFunctions.js'
import * as FF from '../control/flyByFile.js'

import * as M from '../views/map.js'

import * as G from '../Geofence/geofence.js'

import {
    Spinner
} from '../LoadingSpinner/spinner.js'


/**
 * @function <a name="setSummaryPanelInfo">setSummaryPanelInfo</a>
 * @description Sets Summary panel information. Shows basic info about each aircraft.
 * @param none
 * @memberof module:form
 */
export function setSummaryPanelInfo() {
    // display all info from load flight plan message
    let ac_list = AM.getAircraftList();
    let summary_page = document.getElementById('blank');
    summary_page.innerHTML = ''
    
    let m = ''
    for (let item of ac_list) {
        let message = ''
        if (item.status == 0) {
            message = 'No Flight Plan Submitted'
        } else if (item.status == 1) {
            message = 'Plan Submitted and Loaded on Aircraft'
        } else if (item.status == 2) {
            message = 'Aircraft in Flight'
        } else {
            message = 'Unable to communicate with Aircraft'
        }

        m = `${m}
            <br><b>Aircraft: ${item.name}
            <p> Status: ${message}</p> 
            <p> Flight Mode: ${item.mode}</p></b></p>
            <p> Icarous Flight Mode: ${item.icflightmode}</p></b>`
    }

    let div_summary = FM.addDiv('summary_info')
    div_summary.append(FM.addHFive('summary_label','Aircraft Summary:'));
    div_summary.append(FM.addParagraph('status_all', m));

    summary_page.appendChild(FM.addParagraph('mode_status',`Curent GCS Mode: ${MODE.mode}`))
    summary_page.appendChild(div_summary);
}

/**
 * @function <a name="createFilePanel">createFilePanel</a>
 * @description Renders a panel that displays text loaded from a file.
 * @param pan_id {string} Id of node.
 * @memberof module:form
 */
export function createFilePanel(pan_id) {
    // create panel
    let ac_pan_div = FM.addDiv(pan_id, 'panel-body wrapper hide')
    
    // Add label to panel
    let name = pan_id.split('_').splice(2, pan_id.split('_').length - 2).join('_')
    ac_pan_div.appendChild(FM.addHFive('file_label',`File Name: ${name}`))

    // display all info from file
    ac_pan_div.appendChild(FM.addTextArea(`contents_${name}`,'fileplan','off', 50, 40));
    ac_pan_div.appendChild(FM.addBlockButton(name, 'Cancel', 'Cancel Plan', E.clickCancel));
    ac_pan_div.appendChild(FM.addBlockButton(name, 'FlyByFile', 'Fly By File', FF.flybyfile));

    document.getElementById('data-display').appendChild(ac_pan_div);
}

/**
 * @function <a name="createLoadingPanel">createloadingPanel</a>
 * @description Renders a panel that displays spinner and info while waiting for response from server.
 * @param type {string} Name of calling function. ex. loadFlightplan, startup
 * @param ac {object} Aircraft this panel is associated with.
 * @memberof module:form
 */
export function createLoadingPanel(type, ac) {
    let loading_div = FM.addDiv(`loading_${type}_${ac.id}`, 'panel-body wrapper loading hide')
    
    loading_div.appendChild(FM.addHFive('loading_p1','Loading... '))
    addLoadingContent(type, loading_div)
    addSpinner(type, ac.id)
    loading_div.appendChild(FM.addBlockButton(ac.id, 'shutdown', 'Shutdown', E.clickShutdown));

    document.getElementById('data-display').appendChild(loading_div);
}


/**
 * @function <a name="addLoadingContent">addLoadingContent</a>
 * @description Updates and adds information to the loading panel.
 * @param type {string} Type of loading panel. Also used in id.
 * @param parent {object} The HTML Parent node the new info will be appended to.
 * @memberof module:form
 */
function addLoadingContent(type, parent) {
    if (type == 'startup') {
        parent.appendChild(FM.addParagraph('loading_wait', 'Waiting for Heartbeat. '))
    } else if (type == 'sendwaypoints') {
        parent.appendChild(FM.addParagraph('loading_contacting','Contacting Aircraft. '))
    } else if (type == 'startflight') {
        parent.appendChild(FM.addParagraph('startflight','Prepare for liftoff in 3...2...1... '))
    } else if (type == 'paramupdate') {
        parent.appendChild(FM.addParagraph('paramupdate','Updating Parameters'))
    }
}

/**
 * @function <a name="updateAcInMenu">updateAcInMenu</a>
 * @description Updates the Aircraft menu in the header.
 * @param doThis {boolean} Id of node. Default = True. If false wil not list all of
 *                         Aircraft in the menu.
 * @memberof module:form
 */
export function updateAcInMenu(doThis=true) {
    // clear the menu
    let btns = document.getElementById('ac_buttons')
    FM.removeChildren(btns)

    if (MODE.mode == 'SITL') {
        // add new ac button
        btns.appendChild(addNewAircraftButtonToMenu())
    }
    if (doThis) {
        // add all of the ac to the menu
        let ac_list = AM.getAircraftList()
        for (let item of ac_list) {
            btns.appendChild(addACToMenu(item))
        }
    }
}


/**
 * @function <a name="addACToMenu">addACToMenu</a>
 * @description Adds a aircraft button to the header menu.
 * @param ac {object} Aircraft to be added to the header menu.
 * @memberof module:form
 */
export function addACToMenu(ac) {
    // check mode
    if (!MODE.multi) {
        // remove add new aircraft button
        let new_btn = document.getElementById('ac_pan_btn_new_ac')
        new_btn.classList.add('hide')
    }
    // add button to drop down
    let li_item = FM.addListItem()
    // show name if it has one otherwise id
    if (ac.name == ac.id) {
        li_item.appendChild(FM.addBlockButton(ac.id, 'ac_pan', `Aircraft ${ac.id}`, E.clickACPanelShow))
    } else {
        li_item.appendChild(FM.addBlockButton(ac.id, 'ac_pan', ac.name, E.clickACPanelShow))
    }
    li_item.setAttribute('class', 'menu_li')
    return li_item
}

/**
 * @function <a name="addNewAircraftToMenu">addNewAircraftToMenu</a>
 * @description Adds new aircraft button to the header menu. Not exported
 * @memberof module:form
 */
function addNewAircraftButtonToMenu() {
    let li_item = FM.addListItem()
    li_item.appendChild(FM.addBlockButton('new_ac', 'ac_pan', 'New Aircraft ', E.createNewAircraft))
    li_item.firstChild.classList.add('show')
    return li_item
}

/**
 * @function <a name="createSettingsPanel">createSettingsPanel</a>
 * @description Creates settings panel.
 * @param none
 * @memberof module:form
 */
export function createSettingsPanel() {
    //connect to remote host
    let conn_div = FM.addDiv('conn_div')
    conn_div.appendChild(FM.addParagraph('connection_status', 'Connection Status: Disconnected'))
    
    // SITL, HITL or playback
    let mode_div = FM.addDiv('mode_div')
    mode_div.appendChild(FM.addParagraph('mode_input', 'GS Mode', 'input_label'));

    // selection box
    let sel = FM.addSelectionBox('select_mode','input_class','true')
    mode_div.appendChild(sel);

    // Mode options
    sel.appendChild(FM.addOption('SITL', 'SITL'))
    sel.appendChild(FM.addOption('HITL','Connect to Hardware'))
    sel.appendChild(FM.addOption('Playback','Playback'))

    // Show inner panel with other options when one of the options above is selected
    sel.addEventListener('change', function (e) {
        E.changeModeSelection(e)
    })
    let set_pan = document.getElementById('settings');
    set_pan.appendChild(FM.addHFive('set_label', 'WebGS Settings'));
    set_pan.appendChild(conn_div)
    set_pan.appendChild(mode_div);
    
    // mode settings div
    let mode_set_div = FM.addDiv('mode_set_div')
    MODE.modeOptionsSwitch(mode_set_div)

    // create div for buttons
    let btn_div = FM.addDiv('btn_div_settings', 'btndiv')

    set_pan.appendChild(mode_set_div)
    set_pan.appendChild(btn_div)

    E.highlightCurrentSettings()
}


/**
 * @function <a name="updateSettingsPanel">updateSettingsPanel</a>
 * @description Updates settings panel based on current mode settings.
 * @memberof module:form
 */
export function updateSettingsPanel() {
    // update selection box based on os
    if (MODE.server_os != 'Linux') {
        let sel = document.getElementById('select_mode')
        let last
        if (sel) {
            while (last = sel.lastChild) {
                sel.removeChild(last)
            }
        }
        let opt1 = document.createElement('option');
        opt1.setAttribute('value', 'HITL');
        opt1.innerHTML = 'Connect to Hardware'
        sel.appendChild(opt1)
        let opt2 = document.createElement('option');
        opt2.setAttribute('value', 'Playback');
        opt2.innerHTML = 'Playback'
        sel.appendChild(opt2)
    }
    // remove the old div
    let parent_div = document.getElementById('mode_set_div')
    FM.removeChildren(parent_div)

    MODE.modeOptionsSwitch(parent_div)

    parent_div.appendChild(FM.addLink('/docs/index.html','Documentation'))

    // update connection status
    let con = document.getElementById('conn_div')
    if (con) {
        FM.removeChildren(con)
        conn_div.appendChild(FM.addParagraph('connection_status',MODE.con_status))
        E.highlightCurrentSettings()
    }
}


/**
 * @function <a name="createParameterPanel">createParameterPanel</a>
 * @description Creates the aircraft parameter panel.
 * @param ac {object} Aircraft object.
 * @memberof module:form
 */
export function createParameterPanel(ac) {

    let save_div = FM.addDiv('param_save_div','param_save')
    save_div.appendChild(FM.addTextInput(`param_file_load_${ac.id}`, "Load Param File", MODE.load_param_default, E.enterLoadParamsFile))
    save_div.appendChild(FM.addTextInput(`param_file_save_${ac.id}`, "Save Parameters To File", MODE.save_param_default, E.enterSaveParam))

    // display all parameter names and inputs
    let list_div = FM.addDiv('param_input_list', 'param_list')
    ac.parameters.map(function (x) {
        let param_div = FM.addNumberInput(ac.id, 'PARAM_', x.name, 1, 6, parseFloat(x.value), E.onInputHighlight);
        list_div.appendChild(param_div);
    });

    let btn_div = FM.addDiv('param_btn_div','btndiv')
    btn_div.appendChild(FM.addBlockButton(ac.id, 'reload_param', 'Reload Parameters', E.clickReloadParameters))
    btn_div.appendChild(FM.addBlockButton(ac.id, 'submit_param', 'Submit Changes', E.clickSubmitChanges))
    btn_div.appendChild(FM.addBlockButton(ac.id, 'cancel_change', 'Cancel Changes', E.clickCancelChanges))
    
    let ac_pan_div = FM.addDiv(`ac_param_pan_${ac.id}`,'panel-body wrapper param hide')
    ac_pan_div.appendChild(FM.addHFive('param_name_label',`Aircraft ${ac.id} Parameters:`,'acName'));
    ac_pan_div.appendChild(save_div);
    ac_pan_div.appendChild(list_div)
    ac_pan_div.appendChild(btn_div)

    document.getElementById('data-display').appendChild(ac_pan_div);
}

/**
 * @function <a name="updateParamPanel">updateParamPanel</a>
 * @description Updates the Aircraft parameter information.
 * @param ac {object} Aircraft object.
 * @memberof module:form
 */
export function updateParamPanel(ac) {
    FM.removeElement(document.getElementById(`ac_param_pan_${ac.id}`))
    createParameterPanel(ac)
    makePanelActive(`ac_param_pan_${ac.id}`)
}

/**
 * @function <a name="createFlightPlanPanel">createFlightPlanPanel</a>
 * @description Creates the flight plan panel. Allows user to input wp's add traffic and gefences.
 * @param ac {object} Aircraft object.
 * @memberof module:form
 */
export function createFlightPlanPanel(ac) {
    let ac_pan_div = FM.addDiv(`ac_pan_${ac.id}`,'panel-body wrapper ac plan hide')
    ac_pan_div.appendChild(FM.addHFive(`fly_pan_label_${ac.id}`,`Aircraft: ${ac.id}`,'acName'))
    document.getElementById('data-display').appendChild(ac_pan_div)
    
    // mode checking
    let btn_div = MODE.aircraftModeCheck(ac)
    
    ac_pan_div.appendChild(btn_div)
}

/**
 * @function <a name="createInfoPanel">createInfoPanel</a>
 * @description Displays pre flight information after the flight plan is built.
 * @param ac {object} Aircraft object.
 * @memberof module:form
 */
export function createInfoPanel(ac) {
    let pan_id = `ac_info_pan_${ac.id}`
    let ac_pan_div = FM.addDiv(pan_id, 'panel-body wrapper ac info hide')
    ac_pan_div.appendChild(FM.addHFive('info_pan_label',`Aircraft: ${ac.name}`,'acName'))
    
    // display all info from load flight plan message
    let div_info = FM.addDiv(`pre_flight_info_div_${ac.id}`, 'myform')
    div_info.append(aircraftInfo(ac))
    ac_pan_div.appendChild(div_info)

    // mode checking
    let btn_div = MODE.aircraftModeCheck(ac)
    ac_pan_div.appendChild(btn_div)

    document.getElementById('data-display').appendChild(ac_pan_div);

    return pan_id;
}


/**
 * @function <a name="createInFlightPanel">createInFlightPanel</a>
 * @description Displays in-flight information after the flight has started.
 * @param ac {object} Aircraft object.
 * @memberof module:form
 */
export function createInFlightPanel(ac) {
    let pan_id = `ac_inFlight_pan_${ac.id}`

    // add panel
    let ac_pan_div = FM.addDiv(pan_id, 'panel-body wrapper ac inFlight hide')
    
    document.getElementById('data-display').appendChild(ac_pan_div);

    // Add label to panel
    ac_pan_div.appendChild(FM.addHFive('inflight_pan_label',`Aircraft: ${ac.name}`,'acName'));

    // display all info from load flight plan message
    let div_info = FM.addDiv(`flight_info_div_${ac.id}`)
    div_info.append(aircraftInfo(ac));
    ac_pan_div.appendChild(div_info);

    // mode checking
    let btn_div = MODE.aircraftModeCheck(ac)

    ac_pan_div.appendChild(btn_div)

    return pan_id;
}

/**
 * @function <a name="setPanelInfo">setPanelInfo</a>
 * @description Updates the information displayed on the info and in-flight panels.
 * @param ac {object} Aircraft object.
 * @param div_id {string} panel id minus the aircraft id.
 * @memberof module:form
 */
export function setPanelInfo(ac, div_id) {
    // clear the info div
    document.getElementById(`${div_id}${ac.id}`).innerHTML = '';

    // update the div
    let p1 = aircraftInfo(ac)
    document.getElementById(`${div_id}${ac.id}`).appendChild(p1);
}

/**
 * @function <a name="aircraftInfo">aircraftInfo</a>
 * @description Formats the aircraft information.
 * @param ac {Object} Aircraft object.
 * @memberof module:form
 */
export function aircraftInfo(ac) {

    let stuff = `<ul>
        <li>Flight Mode: ${ac.flightmode}</li>
        <li>Icarous Flight Mode: ${ac.icflightmode}</li>
        <li>Lat: ${ac.lat}Lng: ${ac.lng} </li>
        <li>Altitude (m agl): ${ac.alt} Relative alt: ${ac.rel_alt} </li>
        <li>Velocity (m/s) vx: ${ac.vx} vy: ${ac.vy} vz: ${ac.vz} </li>
        <li>Heading: ${ac.hdg} </li>
        <li>Roll: ${ac.roll.toPrecision(3)} Pitch: ${ac.pitch.toPrecision(3)} Yaw: ${ac.yaw.toPrecision(3)}</li>
        <li>Rv: ${ac.rollSpeed.toPrecision(3)} Pv: ${ac.pitchSpeed.toPrecision(3)} Yv: ${ac.yawSpeed.toPrecision(3)}</li>
        <li>Start Time: ${ac.start} </li>
        <ul>Flight Plan: `

    let count = 0
    for (let item of ac.flightplan) {
        stuff = `${stuff} <li>WP ${count} 
            Lat: ${item.wpMarker._latlng.lat.toPrecision(6)}
            Lng: ${item.wpMarker._latlng.lng.toPrecision(6)}
            Alt: ${item.alt} </li>`
        count = count + 1;
    }

    stuff = `${stuff} </ul>
        <li>Battery (mAh): ${ac.voltage} </li>
        <li></li>
        </ul>`

    return FM.addParagraph(`ac_${ac.id}_info`, stuff)
}

/**
 * @function <a name="makePanelActive">makePanelActive</a>
 * @description Link buttons to panels. When btn pressed panel becomes active.
 * @param id {string} Panel id.
 * @memberof module:form
 */
export function makePanelActive(id) {
    removeActive()
    removeHighlight()

    let id_array = id.split('_');
    let pan_type = id_array[0];
    let id_ac = id_array[id_array.length - 1]
    let ac = AM.getAircraftById(id_ac);

    // turn the view off for all other ac and subpanels
    let ac_list = AM.getAircraftList()
    ac_list.forEach(el => {
        if (ac == 'Aircraft Not Found' || ac.id != el.id) {
            if (ac == 'Aircraft Not Found') {
                console.log('Do nothing')
            } else {
                el.activeView = false
            }
        } else if (ac.id == el.id) {
            el.activeView = true
        } else {
            el.activeView = false
        }
    })

    let other = ['blank', 'file', 'loading']
    // make the panel active
    if (pan_type == 'ac') {
        if (id_array[1] == 'param') {
            document.getElementById(`ac_param_pan_${ac.id}`).classList.replace('hide', 'active');
        } else if (ac.status == 3) {
            console.log('Build post flight panel.')
        } else if (ac.status == 2) {
            // create the panel if needed
            checkPanelCreation(`ac_inFlight_pan_${ac.id}`, ac)
            ac.prev_panel = 'inFlight_pan'
            document.getElementById(`ac_inFlight_pan_${ac.id}`).classList.replace('hide', 'active');
        } else if (ac.status == 1) {
            // create the panel if needed
            checkPanelCreation(`ac_info_pan_${ac.id}`, ac)
            ac.prev_panel = 'info_pan'
            document.getElementById(`ac_info_pan_${ac.id}`).classList.replace('hide', 'active');

        } else if (ac.status == 0) {
            // create the panel if needed
            checkPanelCreation(`ac_pan_${ac.id}`, ac)
            ac.prev_panel = 'pan'
            document.getElementById(`ac_pan_${ac.id}`).classList.replace('hide', 'active');
        } else {
            console.log('You screwed up. Please fix it.')
        }
        // adjust the form size
        adjustFormSize()
        // make subpanels associated with this ac active
        subPanelHandler(ac)
    } else if (pan_type == 'settings') {
        document.getElementById(id).classList.replace('hide', 'active');
        updateSettingsPanel()
    } else if (other.includes(pan_type)) {
        document.getElementById(id).classList.replace('hide', 'active');
        updateSettingsPanel();
    } else {
        console.log('This is worse than the other screw up. ')
    }
    contextmenuControl()
    M.DrawFlightPlan()
    G.drawGeofences()
}

/**
 * @function <a name="contextMenuControl">contextMenuControl</a>
 * @description Controls what elements are shown and active in the context menu.
 * @memberof module:form
 */
export function contextmenuControl() {
    let mymap = M.getMap()
    let ac_list = AM.getAircraftList()
    if (MODE.mode == 'Playback') {
        return
    }
    // no ac
    if (ac_list.length < 1) {
        for (let item of mymap.contextmenu._items) {
            // only enable add new
            if (item.el.textContent != 'New Aircraft') {
                mymap.contextmenu.setDisabled(item.el, true)
            }
        }

    } else {
        let ac = AM.getActiveAc()
        // no active ac
        if (ac == 'Aircraft Not Found' || ac == null) {
            for (let item of mymap.contextmenu._items) {
                // only enable add new
                if (item.el.textContent != 'New Aircraft') {
                    mymap.contextmenu.setDisabled(item.el, true)
                }
            }

            // active ac
        } else {

            MODE.updateContextMenu(ac)
            // inFlight
            if (ac.status == 2) {
                // enable all options except add new wp
                for (let item of mymap.contextmenu._items) {
                    if (item.el.textContent == 'Add Waypoint') {
                        mymap.contextmenu.setDisabled(item.el, true)
                    } else {
                        mymap.contextmenu.setDisabled(item.el, false)
                    }
                }
                // pre flight
            } else if (ac.status < 2) {
                // enable all options
                for (let item of mymap.contextmenu._items) {
                    mymap.contextmenu.setDisabled(item.el, false)
                }
                // post flight
            } else {
                // disable all except shutdown
                for (let item of mymap.contextmenu._items) {
                    if (item.el.textContent == 'Shutdown') {
                        mymap.contextmenu.setDisabled(item.el, false)
                    } else {
                        mymap.contextmenu.setDisabled(item.el, true)
                    }
                }
            }
            // check if geofence has been created
            if (ac.gf_list.length == 0) {
                for (let item of mymap.contextmenu._items) {
                    if (item.el.textContent == 'Add Vertex') {
                        mymap.contextmenu.setDisabled(item.el, true)
                    }
                }
            }
        }
    }
}

/**
 * @function <a name="subPanelHandler">subPanelHandler</a>
 * @description Displays and hides desired subpanels.
 * @param ac {Object} Aircraft object.
 * @memberof module:form
 */
export function subPanelHandler(ac) {
    // max 4, sub 2-5; 1 & 6 are smaller and will hold custom indicators
    let opt = document.getElementById('option_div')
    let sub;
    for (let i = 2; i < 6; i++) {
        // clear sub option_div_sub_(#) div's move to option_div
        sub = document.getElementById(`option_div_sub_${i}`)
        while (sub.childNodes.length) {
            opt.appendChild(sub.firstChild)
        }
    }
    let active_sub = []

    // check ac for active subpanels
    for (let item of ac.activeSubPanels) {
        active_sub.push(document.getElementById(item))
    }

    // sort the array for a clean output
    if (ac.activeSubPanels.length > 1) {
        active_sub.sort((a, b) => {
            if (a.id.includes('loading')) {
                return -1
            }
            if (b.id.includes('loading')) {
                return 1
            }
            if (a.id > b.id) {
                return 1
            }
            if (b.id > a.id) {
                return -1
            }
            return 0
        })
    }

    // make the panels active and move to sub option div
    // fill from right to left - 5,4,3,2
    let count = 5;

    for (let item of active_sub) {
        sub = document.getElementById(`option_div_sub_${count}`)
        if (item && sub) {
            sub.appendChild(item)
            item.classList.replace('hide', 'active')
            count -= 1
        }
    }
}

/**
 * @function <a name="createForwardingSubPanel">createForwardingSubPanel</a>
 * @description Creates forwarding sub-panel.
 * @memberof module:form
 */
export function createForwardingSubPanel() {
    let ac = AM.getActiveAc()
    let opt = document.getElementById('option_div')
    opt.appendChild(FM.addDiv(`forwarding_${ac.id}`, 'panel-body wrapper forwarding hide sub'))
    updateForwardingSubPanel()
}

/**
 * @function <a name="updateForwardingSubPanel">updateForwardingSubPanel</a>
 * @description Controls content of forwarding sub-panel
 * @memberof module:form
 */
export function updateForwardingSubPanel() {
    let ac = AM.getActiveAc()
    let pan = document.getElementById(`forwarding_${ac.id}`)
    FM.removeChildren(pan)

    if (!ac.forwarding) {
        pan.appendChild(FM.addHFive('forward_pan_label',` Forward ${ac.name} Data to: `))
        pan.appendChild(FM.addTextInput(`forward_ip_${ac.id}`, 'IP address', ac.f_ip))
        pan.appendChild(FM.addTextInput(`forward_port_${ac.id}`, 'Port', ac.f_port))
        pan.appendChild(FM.addTextInput(`forward_baud_${ac.id}`, 'Port', ac.f_baud))
        pan.appendChild(FM.addBlockButton(ac.id, 'forward_submit', 'Submit', E.submitForwardData))
        pan.appendChild(FM.addBlockButton(ac.id, 'forward_hide', 'Hide Panel', E.hideForwardData))

    } else {
        pan.appendChild(FM.addHFive('forward_pan_label',` Forward ${ac.name} Data to: `))
        pan.appendChild(FM.addParagraph('remote_ip', `Remote IP: ${ac.f_ip}`))
        pan.appendChild(FM.addParagraph('remote_port', `Remote Port: ${ac.f_port}`))
        pan.appendChild(FM.addParagraph('remote_baud', `Remote Baud: ${ac.f_baud}`))
        pan.appendChild(FM.addBlockButton(ac.id, 'forward_remove', 'Stop Forwarding Data', E.removeForwardData))
        pan.appendChild(FM.addBlockButton(ac.id, 'forward_hide', 'Hide Panel', E.hideForwardData))
    }
}

/**
 * @function <a name="checkPanelCreation">checkPanelCreation</a>
 * @description Checks for panel creation, if it hasn't been created will create it.
 * @param pan_id {string} Panel id.
 * @param ac {Object} Aircraft object.
 * @memberof module:form
 */
export function checkPanelCreation(pan_id, ac) {
    let pan = document.getElementById(pan_id)
    if (pan == null) {
        if (ac.status == 3) {
            console.log('create post flight panel')
        } else if (ac.status == 2) {
            createInFlightPanel(ac)
        } else if (ac.status == 1) {
            createInfoPanel(ac)
        } else if (ac.status == 0) {
            createFlightPlanPanel(ac)
        }
    }
}

/**
 * @function <a name="removeActive">removeActive</a>
 * @description Swaps class from active to hide for all active items.
 * @memberof module:form
 */
export function removeActive() {
    try {
        let act = document.getElementsByClassName("active")
        for (let i = act.length - 1; i >= 0; i--) {
            act[i].classList.replace('active', 'hide');
        }
    } catch (e) {
        console.log('Unable to Find active panel.', e);
    }
}

/**
 * @function <a name="removeHighlight">removeHighlight</a>
 * @description Removes highlight class from all items.
 * @memberof module:form
 */
export function removeHighlight() {
    try {
        let highlight = document.getElementsByClassName('highlight')
        for (let i = highlight.length - 1; i >= 0; i--) {
            highlight[i].classList.remove('highlight')
        };
    } catch (e) {
        console.log('No Highlighted Rows ', e)
    }
}

/**
 * @function <a name="adjustFormSize">adjustFormSize</a>
 * @description Ensures panels maintain a certian size based on the screen size.
 * @memberof module:form
 */
export function adjustFormSize() {
    let ac = AM.getActiveAc()
    if (ac != null) {
        // get the parent element
        let par = document.getElementById(`ac_${ac.prev_panel}_${ac.id}`)
        let h = 0
        // get the sum of the heights of the children
        for (let item of par.childNodes) {
            h = h + item.clientHeight
        }
        // subtract the height of the form
        h = h - document.getElementById(`btn_div_${ac.prev_panel}_${ac.id}`).previousElementSibling.clientHeight
        let prev = document.getElementById(`btn_div_${ac.prev_panel}_${ac.id}`).previousElementSibling
        // adjust the min/max height of the form to fit the remaining space in the panel
        prev.style.maxHeight = `${(par.clientHeight - h - (par.clientHeight * .05))}px`
        prev.style.minHeight = `${(par.clientHeight - h - (par.clientHeight * .05))}px`
    }
}


/**
 * @function <a name="createFlightPlanTable">createFlightPlanTable</a>
 * @description Creates table of waypoints for the planning panel
 * @param ac {Object} Aircraft object.
 * @memberof module:form
 */
export function createFlightPlanTable(ac) {

    // add velocity input
    let vel_div = FM.addNumberInput(ac.id, 'VEL', 'Velocity: m/s ', 1, 6, ac.u_vel)
    vel_div.addEventListener('input', E.inputUpdateUVelocity)
    document.getElementById(`ac_fp_form_${ac.id}`).appendChild(vel_div)


    // build the table
    let table = FM.addTable(`ac_fp_table_${ac.id}`, "table ac")
    document.getElementById(`ac_fp_form_${ac.id}`).appendChild(table)

    let header = table.createTHead()
    let rowh = header.insertRow(0)
    let cols = ['ID', 'LAT', 'LNG', 'ALT(m)', '', '']

    // insert elements into header
    for (let i = 0; i < cols.length; i++) {
        let cell_head = rowh.insertCell();
        cell_head.innerHTML = cols[i];
    }

    M.updateFlightPlanOnRowCreate(ac);
    let row_num = 0;
    updateTable(table, ac.id, 'fp', row_num, E.clickAddRowButton, E.clickRemoveRowButton);

    // highlights selected row
    table.addEventListener('click', E.clickTable);
}

/**
 * @function <a name="updateTable">updateTable</a>
 * @description Adds row to table
 * @param table {Object} HTML Table
 * @param id {string} Either ac id, ac id and traffic, or geofence id, point id and aircraft id.
 * @param type {string} ac, fence, traffic
 * @param count {string} row number
 * @param f_a {function} optional: function to add row
 * @param f_r {function} optional: function to remove row
 * @memberof module:form
 */
export function updateTable(table, id, type, count, f_a = 0, f_r = 0, center = M.getCenter(), a, alt = 10) {
    let new_row = addRowToTable(id, type, count, f_a, f_r, center, a, alt)
    table.firstChild.appendChild(new_row)
}

/**
 * @function <a name="addRowToTable">addRowToTable</a>
 * @description creates a new row.
 * @param id {string} Either ac id, ac id and traffic, or geofence id, point id and aircraft id.
 * @param type {string} ac, fence, traffic
 * @param count {string} row number
 * @param f_a {function} optional: function to add row
 * @param f_r {function} optional: function to remove row
 * @param center {Array} [Real, Real]: lat, lng pair
 * @return {Object} HTML Table Row
 * @memberof module:form
 */
export function addRowToTable(id, type, count, f_a = 0, f_r = 0, center = M.getCenter(), a = 1, alt = 10) {

    // add rows to table
    let row1 = FM.addRow(`row_${type}_${id}_${count}`, 'fp_row')

    let cell_0 = row1.insertCell();
    cell_0.setAttribute('class', 'seq')
    cell_0.innerHTML = count;

    let input_block_3 = FM.addInput('number','1',center[0],`LAT_${type}_${id}_${count}`,'input_row')

    let cell_3 = row1.insertCell();
    cell_3.setAttribute('class', 'latlng')
    cell_3.appendChild(input_block_3);

    let input_block_4 = FM.addInput('number','1',center[1],`LNG_${type}_${id}_${count}`,'input_row')

    let cell_4 = row1.insertCell();
    cell_4.setAttribute('class', 'latlng')
    cell_4.appendChild(input_block_4);

    if (a == 1) {
        let input_block_5 = FM.addInput('number','1',alt,`ALT_${type}_${id}_${count}`,'input_row', E.inputUpdateWpAlt)

        let cell_5 = row1.insertCell();
        cell_5.setAttribute('class', 'alt')
        cell_5.appendChild(input_block_5);
    }

    // create buttons
    if (f_a != 0 || f_r != 0) {
        let {
            add_button,
            remove_button
        } = FM.createPlusMinusButtons(id, type, count, f_a, f_r);

        let cell_6 = row1.insertCell();
        cell_6.setAttribute('class', 'btnpm')
        cell_6.id = `cell_add_${type}_${id}_${count}`;
        cell_6.appendChild(add_button);

        let cell_7 = row1.insertCell();
        cell_7.setAttribute('class', 'btnpm')
        cell_7.id = `cell_rem_${type}_${id}_${count}`;
        cell_7.appendChild(remove_button);
    }

    // remove +/- buttons from previous row
    if (count > 0 && f_a != 0) {
        FM.removeElement(document.getElementById(`add_btn_${type}_${id}_${count-1}`))
        FM.removeElement(document.getElementById(`remove_btn_${type}_${id}_${count-1}`))
    }
    return row1
};


/**
 * @function <a name="addSpinner">addSpinner</a>
 * @description Creates loading spinner
 * @param type {string} Part of id.
 * @param id {string} Part of id.
 * @memberof module:form
 */
export function addSpinner(type, id) {
    let opts = {
        lines: 13, // The number of lines to draw
        length: 38, // The length of each line
        width: 10, // The line thickness
        radius: 20, // The radius of the inner circle
        scale: .5, // Scales overall size of the spinner
        corners: 0.9, // Corner roundness (0..1)
        color: '#bb4545', // CSS color or array of colors
        fadeColor: 'transparent', // CSS color or array of colors
        speed: 1.0, // Rounds per second
        rotate: 0, // The rotation offset
        animation: 'spinner-line-fade-more', // The CSS animation name for the lines
        direction: 1, // 1: clockwise, -1: counterclockwise
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        className: 'spinner', // The CSS class to assign to the spinner
        top: '50%', // Top position relative to parent
        left: '50%', // Left position relative to parent
        shadow: '0 0 1px transparent', // Box-shadow for the lines
        position: 'absolute' // Element positioning
    };

    let target = document.getElementById(`loading_${type}_${id}`);
    let spinner = new Spinner(opts).spin(target);
}
