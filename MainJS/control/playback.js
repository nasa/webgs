/**
 *
 * @module playback
 * @version 1.0.0
 * @description <b> Library for playback interface. </b>
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
    MODE, 
    AM
} from '../control/entry.js'
import * as C from '../control/comms.js'

import * as FM from '../models/formElements.js'

let last_move = new Date()
let SKIP_DISTANCE = 30

/**
 * @function <a name="createPlaybackMenu">createPlaybackMenu</a>
 * @description generates the playback menu, displays it
 * @param none
 * @memberof module:playback
 */
export function createPlaybackMenu() {
    let body = document.body
    let menu = FM.addDiv('playbackMenu','playback')
    body.appendChild(menu)

    menu.appendChild(FM.addPlaybackInput('stop', 'playbackButtons', 'image', '../images/stop-svgrepo-com.svg', sendStopPlayback))
    menu.appendChild(FM.addPlaybackInput('rew', 'playbackButtons', 'image', '../images/rewind-svgrepo-com.svg', sendRewPlayback))
    menu.appendChild(FM.addPlaybackInput('playpause', 'playbackButtons', 'image', '../images/pause-play-button-svgrepo-com.svg', sendPlayPlayback))
    menu.appendChild(FM.addPlaybackInput('ff', 'playbackButtons', 'image', '../images/fast-forward-svgrepo-com.svg', sendFFPlayback))
    menu.appendChild(FM.addPlaybackInput( 'skip', 'playbackButtons', 'image', '../images/fast-forward-button-svgrepo-com.svg', sendSkipPlayback))

    let container = FM.addDiv('prog_container','prog_container')
    menu.appendChild(container)

    let bar = FM.addDiv('bar','statusBar')
    container.appendChild(bar)
    bar.appendChild(FM.addDiv('prog','progBar'))
    bar.appendChild(FM.addDiv('dot','dot'))

    container.appendChild(FM.addDiv('total_time','total_time'))

    MODE.playerActive = true

    setInterval(checkLastMove, 2000)
    window.addEventListener('mousemove', mouseTracker)
}

/**
 * @function <a name="updatePlaybackMenu">updatePlaybackMenu</a>
 * @description updates time, progress bar, and elapsed time
 * @param current {string} elapsed time
 * @param total {string} total playback time
 * @param percent {string} percent of total time played
 * @memberof module:playback
 */
export function updatePlaybackMenu(current, total, percent) {
    // console.log(current, total, percent)
    try {
        document.getElementById('prog').style.width = parseInt(percent).toString() + '%'
        document.getElementById('total_time').innerHTML = parseFloat(total).toFixed(2)
        document.getElementById('prog').innerHTML = parseFloat(current).toFixed(2)
    } catch (e) {
        console.log(e)
    }
}


/**
 * @function <a name="checkLastMove">checkLastMove</a>
 * @description hides the playback menu if the mouse hasn't moved for 5 sec
 * @param none
 * @memberof module:playback
 */
function checkLastMove() {
    let now = new Date()
    if (now - last_move > 5000 && MODE.playerActive) {
        let menu = document.getElementById('playbackMenu')
        menu.setAttribute('class', 'playback hide')
    }
}

/**
 * @function <a name="mouseTracker">mouseTracker</a>
 * @description activates the menu when the mouse moves
 * @param none
 * @memberof module:playback
 */
function mouseTracker() {
    if (MODE.mode == 'Playback' && MODE.playerActive) {
        let now = new Date()
        let menu = document.getElementById('playbackMenu')
        menu.setAttribute('class', ' playback show')
        last_move = now
    }
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
 * @function <a name="sendStartPlayback">sendStartPlayback</a>
 * @description Sends message to start playback, and creates the menu. Or, alerts user that playback is already running.
 * @param none
 * @memberof module:eventFunctions
 */
export function sendStartPlayback() {
    let menu = document.getElementById('playbackMenu')
    if (!menu) {

        C.sendFullMessage(`AIRCRAFT None PLAYBACK START ${MODE.filename}`)
        // show playback button menu
        createPlaybackMenu()
    } else {
        FM.alertBannerRed('Playback already running. Press Stop to play a new file.')
    }
}

/**
 * @function <a name="sendPlayPlayback">sendPlayPlayback</a>
 * @description Sends play message to server.
 * @param none
 * @memberof module:eventFunctions
 */
export function sendPlayPlayback() {
    C.sendFullMessage('AIRCRAFT None PLAYBACK PLAY')
}

/**
 * @function <a name="sendStopPlayback">sendStopPlayback</a>
 * @description Sends stop message to server. Removes all aircraft and the playback menu.
 * @param none
 * @memberof module:eventFunctions
 */
export function sendStopPlayback() {
    // has to be the same as ac shutdown, need to remove everything
    C.sendFullMessage('AIRCRAFT -1 SHUTDOWN -1 PLAYBACK')
    MODE.playerActive = false
    // check mode
    for (let ac of AM.aircraft_list) {
        acShutdown(ac)
    }
    // remove playback controls
    FM.removeElement(document.getElementById('playbackMenu'))
}

/**
 * @function <a name="sendRewPlayback">sendRewPlayback</a>
 * @description Sends rewind message to server.
 * @param none
 * @memberof module:eventFunctions
 */
export function sendRewPlayback() {
    C.sendFullMessage('AIRCRAFT None PLAYBACK REW')
}

/**
 * @function <a name="sendFFPlayback">sendFFPlayback</a>
 * @description Sends fast forward message to server.
 * @param none
 * @memberof module:eventFunctions
 */
export function sendFFPlayback() {
    C.sendFullMessage('AIRCRAFT None PLAYBACK FF')
}

/**
 * @function <a name="sendSkipPlayback">sendSkipPlayback</a>
 * @description Sends skip message to server.
 * @param none
 * @memberof module:eventFunctions
 */
export function sendSkipPlayback() {
    C.sendFullMessage(`AIRCRAFT None PLAYBACK SKIP ${SKIP_DISTANCE}`)
}
