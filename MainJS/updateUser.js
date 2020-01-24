/**
 *
 * @module updateUser
 * @version 1.0.0
 * @description <b> Library for saving and loading user settings. </b>
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



import * as E from './eventFunctions.js';
import * as comms from './comms.js';
import * as form from './form.js'


/**
 * @function <a name="readSettings">readSettings</a>
 * @description sends message to read user settings file
 * @param none
 * @memberof module:updateUser
 */
export function readSettings() {
    let msg = 'READ_USER_SETTINGS'
    comms.sendMessage(msg)
}


/**
 * @function <a name="updateModeFromFile">updateModeFromFile</a>
 * @description takes response from read settings and update the mode settings
 * @param settings_list {Array} array of settings and values [{setting: value}, {setting: value}, ...]
 * @memberof module:updateUser
 */
export function updateModeFromFile(settings_list) {
    let MODE = E.getMode()
    for (let item in settings_list) {
        if (item != 'name') {
            if (settings_list[item] == 'true') {
                settings_list[item] = true
            }
            if (settings_list[item] == 'false') {
                settings_list[item] = false
            }
            MODE[item] = settings_list[item]
        }
    }
    MODE.ipAddress = comms.ip_used
    MODE.port = comms.port_used
    form.updateSettingsPanel();

}


/**
 * @function <a name="updateModeFromFile">updateModeFromFile</a>
 * @description takes the current mode settings and saves them to file
 * @param none
 * @memberof module:updateUser
 */
export function updateUserSettingsFile() {
    let MODE = E.getMode()
    let msg = 'SAVE_USER_SETTINGS '
    let ignore = ['mode', 'activeSubPanels', 'context_added', 'flybyfile', 'con_status']
    for (var key in MODE) {
        if (MODE.hasOwnProperty(key)) {
            if (ignore.includes(key)) {
                console.log('IGNORE:', key + " -> " + MODE[key]);

            } else {
                console.log(key + " -> " + MODE[key]);
                msg = msg + ' ' + key + ' ' + MODE[key]
            }
        }
    }
    comms.sendFullMessage('AIRCRAFT None ' + msg)
}