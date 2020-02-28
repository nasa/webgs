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
    MODE
} from '../control/entry.js'

import * as E from './eventFunctions.js'

let last_move = new Date()

/**
 * @function <a name="createPlaybackMenu">createPlaybackMenu</a>
 * @description generates the playback menu, displays it
 * @param none
 * @memberof module:playback
 */
export function createPlaybackMenu() {
    let body = document.body
    let menu = document.createElement('div')
    menu.setAttribute('id', 'playbackMenu')
    menu.setAttribute('class', 'playback')
    body.appendChild(menu)

    let stop = document.createElement('input')
    stop.setAttribute('id', 'stop')
    stop.setAttribute('class', 'playbackButtons')
    stop.setAttribute('type', 'image')
    stop.setAttribute('src', '../images/stop-svgrepo-com.svg')
    stop.addEventListener('click', E.sendStopPlayback)
    menu.appendChild(stop)

    setInterval(checkLastMove, 2000)
    window.addEventListener('mousemove', mouseTracker)

    let rew = document.createElement('input')
    rew.setAttribute('id', 'rew')
    rew.setAttribute('class', 'playbackButtons')
    rew.setAttribute('type', 'image')
    rew.setAttribute('src', '../images/rewind-svgrepo-com.svg')
    rew.addEventListener('click', E.sendRewPlayback)
    menu.appendChild(rew)

    let play = document.createElement('input')
    play.setAttribute('id', 'playpause')
    play.setAttribute('class', 'playbackButtons')
    play.setAttribute('type', 'image')
    play.setAttribute('src', '../images/pause-play-button-svgrepo-com.svg')
    play.addEventListener('click', E.sendPlayPlayback)
    menu.appendChild(play)

    let ff = document.createElement('input')
    ff.setAttribute('id', 'ff')
    ff.setAttribute('class', 'playbackButtons')
    ff.setAttribute('type', 'image')
    ff.setAttribute('src', '../images/fast-forward-svgrepo-com.svg')
    ff.addEventListener('click', E.sendFFPlayback)
    menu.appendChild(ff)

    let skip = document.createElement('input')
    skip.setAttribute('id', 'skip')
    skip.setAttribute('class', 'playbackButtons')
    skip.setAttribute('type', 'image')
    skip.setAttribute('src', '../images/fast-forward-button-svgrepo-com.svg')
    skip.addEventListener('click', E.sendSkipPlayback)
    menu.appendChild(skip)


    let container = document.createElement('div')
    container.setAttribute('class', 'prog_container')
    menu.appendChild(container)

    let bar = document.createElement('div')
    bar.setAttribute('id', 'bar')
    bar.setAttribute('class', 'statusBar')
    container.appendChild(bar)

    let total_time = document.createElement('div')
    total_time.setAttribute('id', 'total_time')
    total_time.setAttribute('class', 'total_time')
    container.appendChild(total_time)



    let prog = document.createElement('div')
    prog.setAttribute('id', 'prog')
    prog.setAttribute('class', 'progBar')
    bar.appendChild(prog)

    let dot = document.createElement('div')
    dot.setAttribute('class', 'dot')
    bar.appendChild(dot)

    MODE.playerActive = true

    // let current_time = document.createElement('div')
    // current_time.setAttribute('id', 'current_time')
    // current_time.setAttribute('class', 'current_time')
    // dot.appendChild(current_time)

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