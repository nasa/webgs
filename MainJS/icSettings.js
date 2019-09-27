/**
 *
 * @module icSettings
 * @version 1.0.0
 * @description <b> icSettings module </b>
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
import * as E from '../MainJS/eventFunctions.js';
import * as form from '../MainJS/form.js';


class icAppSettings {
    /**
     * @function <a name="icAppSettings">icAppSettings</a>
     * @description Constructor.
     * @param none
     * @memberof module:icSettings
     * @class icAppSettings
     * @instance
     */
    constructor() {
        this.ic_toggle = true;
        this.app_list = [];
    }

    /**
     * @function <a name="getApps">getApps</a>
     * @description Sends Icarous get apps message.
     * @param none
     * @memberof module:icSettings
     * @class icAppSettings
     * @instance
     */
    getApps() {
        let MODE = E.getMode()
        comms.sendMessage('ICAROUS_STARTUP GET_NAMES ' + MODE.path);
    }

    /**
     * @function <a name="switchApps">switchApps</a>
     * @description Sends two app names that need to be swapped
     * @param app1 {string} app1 name.
     * @param app2 {string} app2 name.
     * @param status {Boolean} optional default=true, True=Active, False=Disabled
     * @memberof module:icSettings
     * @class icAppSettings
     * @instance
     */
    switchApps(app1, app2, status = true) {
        let MODE = E.getMode()
        comms.sendMessage('ICAROUS_STARTUP CHANGE_APPS ' + MODE.path + app1 + ' ' + app2 + ' ' + status);

        // update the app list
        this.getApps()
    }

    /**
     * @function <a name="addApp">addApp</a>
     * @description Adds app to app list.
     * @param name {string} app name.
     * @param status {Boolean} True=Active, False=Disabled
     * @memberof module:icSettings
     * @class icAppSettings
     * @instance
     */
    addApp(name, status) {
        let app = new icApp(name, status)
        this.app_list.push(app)
    }

    /**
     * @function <a name="clearList">clearList</a>
     * @description Clears the current app list
     * @param none
     * @memberof module:icSettings
     * @class icAppSettings
     * @instance
     */
    clearList() {
        this.app_list = []
    }

    /**
     * @function <a name="submitList">submitList</a>
     * @description Sends updated (based on user selection) app list to server.
     * @param none
     * @memberof module:icSettings
     * @class icAppSettings
     * @instance
     */
    submitList() {
        let MODE = E.getMode()
        let msg = ''
        for (let item of this.app_list) {
            msg = msg + ' ' + item.name + ' ' + item.status
        }
        comms.sendMessage('ICAROUS_STARTUP ACTIVE ' + MODE.path + msg)
    }
}

class icApp {
    /**
     * @function <a name="icApp">icApp</a>
     * @description Constructor.
     * @param name {string} Name of app.
     * @param status {Boolean} True=Active, False=Disabled
     * @memberof module:icSettings
     * @class icAppSettings
     * @instance
     */
    constructor(name, status) {
        this.name = name;
        this.status = status;
    }

    /**
     * @function <a name="changeStatus">changeStatus</a>
     * @description Changes an individual app's status.
     * @param status {boolean} True=Active, False=Disabled
     * @memberof module:icSettings
     * @class icApp
     * @instance
     */
    changeStatus(status) {
        comms.sendMessage('ICAROUS_STARTUP ACTIVE ' + this.name + ' ' + status)
    }

}

let ic_apps = new icAppSettings()

/**
 * @function <a name="get_apps">get_apps</a>
 * @description Get loaded apps.
 * @param none
 * @return {Object} icAppsSettings object.
 * @memberof module:icSettings
 */
export function getIcApps() {
    return ic_apps
}

/**
 * @function <a name="clickChangeIcSettings">clickChangeIcSettings</a>
 * @description Creates and loads Ic apps subpanel.
 * @param none
 * @memberof module:icSettings
 */
export function clickChangeIcSettings() {
    // update mode
    let MODE = E.getMode()
    MODE.icSettings = ic_apps

    // check for valid path
    comms.sendFullMessage('CHECK_PATH ' + MODE.path)

    // get info from server
    ic_apps.getApps()

    //create the subpanel
    createIcSettingsPanel()
    createLoadingPanel('get_apps')

    // make it active
    makeIcPanelActive('loading_ic_get_apps')
}

/**
 * @function <a name="createIcSettingsPanel">createIcSettingsPanel</a>
 * @description Creates Ic apps subpanel.
 * @param none
 * @memberof module:icSettings
 */
export function createIcSettingsPanel() {
    let pan = document.getElementById('ic_settings_pan')
    if (pan == null) {
        let option_div = document.getElementById('option_div')
        let pan_id = 'ic_settings_pan'
        let pan = document.createElement('div')
        pan.setAttribute('class', 'panel-body wrapper ic hide sub')
        pan.setAttribute('id', pan_id)
        option_div.appendChild(pan)
    } else {
        let MODE = E.getMode()
        MODE.activeSubPanels.push('ic_settings_pan')
        form.makePanelActive('settings')
    }
    updateIcSettingsPanel()
}

/**
 * @function <a name="updateIcSettingsPanel">updateIcSettingsPanel</a>
 * @description Updates Ic apps subpanel after a change.
 * @param none
 * @memberof module:icSettings
 */
export function updateIcSettingsPanel() {
    let pan = document.getElementById('ic_settings_pan')
    // remove current info

    if (pan != null) {
        let MODE = E.getMode()
        let children = pan.childNodes
        for (let i = children.length - 1; i >= 0; i--) {
            pan.removeChild(children[0])
        }

        // add new info
        let title = document.createElement('h5')
        title.innerHTML = 'Icarous Settings'
        pan.appendChild(title)


        // only show if Icarous is going to be turned on
        if (MODE.icSettings.ic_toggle) {

            // display the list of apps
            let ul = document.createElement('ul')
            ul.setAttribute('class', 'ic_settings_list')

            let p1 = document.createElement('p')
            p1.innerHTML = 'App Selection'
            pan.appendChild(p1)
            pan.appendChild(ul)

            let li;
            for (let item of MODE.icSettings.app_list) {
                li = document.createElement('li')
                let app_buttons = form.addButtonSwitch('app_toggle_' + item.name, item.name, function () {
                    clickIcToggleButton('app_toggle_' + item.name);
                })
                li.appendChild(app_buttons)
                ul.appendChild(li)

                // highlight curent status
                if (item.status) {
                    document.getElementById('app_toggle_' + item.name + '_on').classList.add('highlight')
                } else {
                    document.getElementById('app_toggle_' + item.name + '_off').classList.add('highlight')
                }
            }

            // create div for btns
            let btn_div = document.createElement('div')
            btn_div.setAttribute('class', 'ic_btndiv')
            // submit btn
            btn_div.appendChild(form.addBlockButton('ic_submit', 'ic_submit', 'Submit App Settings', clickIcSubmitAppSettings))

            // cancel btn
            btn_div.appendChild(form.addBlockButton('ic_cancel', 'ic_cancel', 'Cancel Changes', clickIcCancel))

            pan.appendChild(btn_div)
        }
    }
}


/**
 * @function <a name="clickIcSubmitAppSettings">clickIcSubmitAppSettings</a>
 * @description Sends message to server and updates the panel.
 * @param none
 * @memberof module:icSettings
 */
export function clickIcSubmitAppSettings() {
    let MODE = E.getMode()
    MODE.icSettings.submitList()
    updateIcSettingsPanel()
}

/**
 * @function <a name="clickIcCancel">clickIcCancel</a>
 * @description Cancels changes and removes the panel.
 * @param none
 * @memberof module:icSettings
 */
export function clickIcCancel() {
    let MODE = E.getMode()
    MODE.activeSubPanels = []
    let el = document.getElementById('ic_settings_pan')
    el.parentNode.removeChild(el)
}

/**
 * @function <a name="clickIcToggleButton">clickIcToggleButton</a>
 * @description Listens for click and changes the app status.
 * @param name {string} name of app to change status.
 * @memberof module:icSettings
 */
export function clickIcToggleButton(name) {

    let MODE = E.getMode()
    let here_ = false;
    let on = document.getElementById(name + '_on')
    let off = document.getElementById(name + '_off')
    let obj;
    if (name == 'ic_toggle') {
        // get the object
        obj = MODE.icSettings.ic_toggle
        // change the status
        if (obj) {
            MODE.icSettings.ic_toggle = false
        } else {
            MODE.icSettings.ic_toggle = true
        }
        updateIcSettingsPanel()
    } else {
        // get the object
        obj = MODE.icSettings.app_list.filter((el, ind) => {
            if ('app_toggle_' + el.name == name) {
                return el
            }
        })
        // change the status
        if (obj[0].status) {
            obj[0].status = false
        } else {
            obj[0].status = true
        }
    }

    // change the highlight
    on.classList.forEach(function (item) {
        if (item == 'highlight') {
            on.classList.remove('highlight');
            off.classList.add('highlight');
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
        }
    });
}

/**
 * @function <a name="makeIcPanelActive">makeIcPanelActive</a>
 * @description Makes the subpanel active so it can be viewed.
 * @param none
 * @memberof module:icSettings
 */
export function makeIcPanelActive(pan_id) {
    let MODE = E.getMode()
    MODE.activeSubPanels.push(pan_id)
    form.makePanelActive('settings')
}


/**
 * @function <a name="createLoadingPanel">createLoadingPanel</a>
 * @description Creates loading subpanel.
 * @param type {string} used inpan id
 * @todo loading panel is not needed, loads fast enough. get rid of it.
 * @memberof module:icSettings
 */
export function createLoadingPanel(type) {
    let loading_div;
    if (document.getElementById('type') == null) {
        // create the panel
        let option_div = document.getElementById('option_div')
        let pan_id = 'loading_ic_' + type
        let pan = document.createElement('div')
        pan.setAttribute('class', 'panel-body wrapper loading ic hide sub')
        pan.setAttribute('id', pan_id)
        option_div.appendChild(pan)

        // create a div
        loading_div = document.createElement('div');
        loading_div.setAttribute('id', 'loading_ic_' + type);
        pan.appendChild(loading_div);

    }

    // add the info
    addLoadingContent(type, loading_div)
    form.addSpinner('ic_' + type)
}

/**
 * @function <a name="addLoadingContent">addLoadingContent</a>
 * @description Adds content to the loading subpanel.
 * @param type {string} used inpan id
 * @param parent {Object} Div to append content to.
 * @todo loading panel is not needed, loads fast enough. get rid of it.
 * @memberof module:icSettings
 */
function addLoadingContent(type, parent) {
    // remove all children from parent
    for (let item of parent.childNodes) {
        item.parentNode.removeChild(item)
    }

    // add a title
    let h4 = document.createElement('H5');
    h4.setAttribute('id', 'loading_p1');
    h4.innerHTML = 'Loading... '
    parent.appendChild(h4)

    // add content
    let p1;
    if (type == 'get_apps') {
        p1 = document.createElement('p')
        p1.setAttribute('id', 'ic_settings')
        p1.innerHTML = 'Gathering Icarous Settings.'
        parent.appendChild(p1)
    }

    parent.appendChild(p1)
}