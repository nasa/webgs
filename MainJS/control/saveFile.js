/**
 *
 * @module saveFile
 * @version 1.0.0
 * @description <b> Library of save file functions. </b>
 * Save documents to the server in Examples folder.
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


import * as C from '../control/comms.js';


/**
 * @function <a name="save_parameters">save_parameters</a>
 * @description Saves parameter files to Examples/Parameters.
 * @param ac {Object} Aircraft object
 * @param filename {string} name of file
 * @memberof module:saveFile
 */
export function save_parameters(ac, filename) {
    filename = '/Examples/Parameters/' + filename
    let data = JSON.stringify(ac.parameters)
    let msg = 'AIRCRAFT ' + ac.id + ' SAVE PARAM ' + filename + ' ' + data
    C.sendFullMessage(msg)
}

/**
 * @function <a name="save_waypoints">save_waypoints</a>
 * @description Saves waypoint files to Examples/FlightPlans.
 * @param ac {Object} Aircraft object
 * @param filename {string} name of file
 * @memberof module:saveFile
 */
export function save_waypoints(ac, filename) {
    filename = '/Examples/FlightPlans/' + filename
    let wp_string = ac.flightplanToString()
    let data = 'VEL ' + ac.u_vel + ' WP' + wp_string
    let msg = 'AIRCRAFT ' + ac.id + ' SAVE WAYPOINTS ' + filename + ' ' + data
    C.sendFullMessage(msg)
}

/**
 * @function <a name="save_traffic">save_traffic</a>
 * @description Saves Traffic files to Examples/Traffic.
 * @param ac {Object} Aircraft object
 * @param lat {string}
 * @param lng {string}
 * @param alt {string}
 * @param vel {string}
 * @param hdg {string}
 * @param emit {string}
 * @param filename {string} name of file
 * @memberof module:saveFile
 */
export function save_traffic(ac, lat, lng, alt, vel, hdg, emit, filename) {
    filename = '/Examples/Traffic/' + filename
    let data = lat + ' ' + lng + ' ' + alt + ' ' + vel + ' ' + hdg + ' ' + emit
    let msg = 'AIRCRAFT ' + ac.id + ' SAVE TRAFFIC ' + filename + ' ' + data
    C.sendFullMessage(msg)
}

/**
 * @function <a name="save_geofences">save_geofences</a>
 * @description Saves geofence files to Examples/Geofences.
 * @param ac {Object} Aircraft object
 * @param filename {string} name of file
 * @param data {Array} Array of geofence data.
 * @memberof module:saveFile
 */
export function save_geofences(ac, filename, data) {
    filename = '/Examples/GeoFences/' + filename
    // id, type, num, floor, roof, pid, lat, lng, pid, lat, lng ...
    let msg = 'AIRCRAFT ' + ac.id + ' SAVE GEOFENCE ' + filename + ' ' + data.join(' ')
    C.sendFullMessage(msg)
}

// // test scripts
// export function save_script(ac, filename) {
//     filename = '/Examples/TestScripts/' + filename
//     let data = 1 // have to get data from the form
//     let msg = 'AIRCRAFT ' + ac.id + ' SAVE SCRIPT ' + filename + ' ' + data
//     C.sendFullMessage(msg)
// }