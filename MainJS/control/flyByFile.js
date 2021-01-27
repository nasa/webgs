/**
 *
 * @module flyByFile
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



import {
    AM,
    MODE
} from '../control/entry.js'

import * as C from '../control/comms.js'
import * as E from '../control/eventFunctions.js'

import * as FM from '../models/formElements.js'

import * as G from '../Geofence/geofence.js'


/**
 * @function <a name="flybyfile">flybyfile</a>
 * @description Take text from a loaded file and turn that into a series of commands that the front end can execute.
 * @param none
 * @returns {Promise.<void>} Starts scriptLoop as async function.
 * @memberof module:flyByFile
 */
export async function flybyfile() {
    let c_list = document.getElementsByClassName('fileplan')
    let text = c_list[0].innerHTML
    let lines = text.split('\n')
    MODE.flybyfile = true

    let command_list = [
        'repeat',
        'const',
        'param',
        'start',
        'forward',
        'wp',
        'geofence',
        'time',
        'long',
        'traffic',
        'wind', // will be used later
        'stop',
        'adjust',
        '#', // comments
        '' // blank lines
    ]

    let words;
    let line_num = 0
    let command_num = 0
    let repeat = 1
    let adjust_list = []
    let command;
    let com;
    let func;
    let fun;
    let args;
    let x;
    let rep;
    let exp_args = [];
    let prev_ind;
    let acount = 0
    let w
    let v
    let h = false
    let const_obj = {}

    // check for errors or unknown commands
    for (let line of lines) {
        // split on the first space ignore the rest
        words = line.split(/ (.*)/)

        // increase line num
        line_num += 1
        // increase command num
        if (words[0] != '' && words[0] != '#') {
            command_num += 1
        }

        // check for unknown commands
        if (!command_list.includes(words[0])) {
            form.alertBannerRed(`Line: ${line_num} Unknown Command: ${words[0]}`)
            return
        }

        // repeat must be at the top
        if (command_num == 1) {
            if (words[0] == 'repeat') {
                try {
                    repeat = parseInt(words[1])
                } catch (e) {
                    form.alertBannerRed(`Repeat Value not an Int, Line: ${line_num}`)
                }

            }
        } else if (words[0] == 'repeat') {
            form.alertBannerRed(`Line: ${line_num} Unexpected Repeat`)
            return
        }

        // get constants
        if (words[0] == 'const') {
            w = words[1].split(' ')
            const_obj[w[0]] = w[1]
            h = true
        }

        // check for words in constants list
        if (h && words[1]) {
            for (let key in const_obj) {
                v = words[1].split(/[' ',\,,\(,\)]/g)
                for (let i = v.length - 1; i >= 0; i--) {
                    if (v[i] == key) {
                        v[i] = const_obj[key]
                    } else if (v[i] == '') {
                        v.splice(i, 1)
                    }
                }
                words[1] = `${v.join(', ')})`
            }
        }

        // deal with adjust
        if (words[0] == 'adjust') {
            if (repeat == 0) {
                form.alertBannerRed(`Unexpected Adjust command, line: ${line_num}`)
                return
            } else if (words.length != 3) {
                form.alertBannerRed(`Adjust command given incorrect number of arguments, line: ${line_num}`)
                return
            } else {
                acount++
                exp_args = []
                // parse the command
                command = words[1].split(/ (.*)/)
                com = command[0]
                func = command[1].replace('(', ',').replace(')', '').replace(/\s/g, '').split(',')
                args = func.slice(1, func.length)

                // expand args ex [args, *2] = [args, args]
                prev_ind = -1
                args = args.filter((el, ind) => {
                    if (el.includes('*')) {
                        rep = el.split('*')
                        rep = parseInt(rep[1])
                        for (let i = 0; i < rep; i++) {
                            exp_args = exp_args.concat(args.slice(prev_ind + 1, ind))

                        }
                        prev_ind = ind
                        return
                    }
                })

                // get the number of args passed on each repeat
                if (exp_args.length % repeat == 0) {
                    x = exp_args.length / (repeat)
                } else {
                    form.alertBannerRed(`Adjust inner function given incorrect number of arguments, line: ${line_num}`)
                    return
                }

                // build the command
                for (let i = 0; i < repeat; i++) {
                    fun = `${func[0]}(${exp_args.slice(i * x, ((i + 1) * x)).join(', ')})`

                    // allows for multiple adjust commands
                    adjust_list.splice((i * acount + acount) - 1, 0, [com, fun])
                }

            }
        }
    }

    let script = []
    // handle the repeat and adjust
    script.push(['stop', 'all'])
    let next
    for (let r = 0; r < repeat; r++) {
        // add a comment to show how far into the script we are
        script.push(['comment', (r), repeat])

        for (let line of lines) {
            words = line.split(/ (.*)/)
            // skip repeat, any blank lines, or comments
            if (words[0] != 'repeat' && words[0] != '' && words[0] != '#') {
                if (words[0] == 'adjust') {
                    next = adjust_list.shift()
                    script.push(next)
                } else {
                    script.push(words)
                }
            }
        }
        // check insert stop all after last command before repeating
        script.push(['stop', 'all'])
    }
    // insert EOF marker to break out of loop
    script.push(['END', 'TEST'])
    console.log(script)

    // run the script
    await scriptLoop(script)
    MODE.flybyfile = false
}


/**
 * @function <a name="scriptLoop">scriptLoop</a>
 * @description Takes a formated script and executes the commands.
 * @param script {Array} List of commands to be run.
 * @memberof module:flyByFile
 */
async function scriptLoop(script) {
    // run the script
    // TODO: find better way to send next commands
    let timeout_table = {
        start: 500,
        stop: 1000,
        param: 50,
        time: 1000,
        long: 50,
        traffic: 50,
        wp: 50,
        geofence: 50,
        comment: 1,
        forward: 500,
        wind: 5000
    }

    // turn on banner for fly by file
    let banner = FM.addDiv('b_banner','b_overlay')

    let b_text = FM.addDiv('b_text')
    b_text.innerHTML = 'Fly by File in progress. Completed 0 of 0 flights.'

    banner.appendChild(b_text)
    document.body.appendChild(banner)

    let start = Date.now()
    let last = Date.now()
    let a_list;

    // start the script
    for (let line of script) {
        // finish cleaning up the command
        a_list = parseMessage(line)

        // Run the command
        functionSwitch(line, a_list)

        // check for wait time
        if (line[0] == 'time') {
            timeout_table['time'] = parseInt(a_list[1]) * 1000
        }

        // using timeout after the function call to guarantee the function waits before the next line is executed
        await new Promise((resolve, reject) => setTimeout(resolve, timeout_table[line[0]]))
        console.log('Total Run Time: ', (Date.now() - start) / 1000)
        console.log('Time since last command: ', (Date.now() - last) / 1000)
        last = Date.now()

    }

    // remove the banner
    FM.removeElement(banner)
}


/**
 * @function <a name="parseMessage">parseMessage</a>
 * @description Parses a line from the script and returns it as a cleaned array.
 * @param line {string} string.
 * @returns {Array}
 * @memberof module:flyByFile
 */
function parseMessage(line) {
    let line_list
    if (line[0] != 'comment') {
        line_list = line[1].replace(')', '').replace('(', ', ').split(', ')
    }
    return line_list
}


/**
 * @function <a name="functionSwitch">functionSwitch</a>
 * @description Executes the lines of the script.
 * @param line {string} string.
 * @param a_list {Array} list of strings used as parameters for a function
 * @memberof module:flyByFile
 */
function functionSwitch(line, a_list) {
    let ac
    // just in case
    line[0] = line[0].replace(/[\,'\(,\),\{,\},\[,\]]/g, '')
    switch (line[0]) {
        case 'param':
            // expected format - ['file', id, 'path/to/new/file.txt']
            // expected format - ['single', id, param_id, param_value, param_type]
            let message
            ac = AM.getAircraftByName(a_list[1])
            if (a_list[0] == 'file') {
                message = `AIRCRAFT ${ac.id} LOAD_PARAM_FILE /${a_list[2]}`

            } else if (a_list[0] == 'single') {
                message = `AIRCRAFT ${a_list[1]} CHANGE_PARAM ${a_list[2]} ${ a_list[3]} ${ a_list[4]}`
            }
            C.sendFullMessage(message)
            break;

        case 'start':
            // expected format - start newAC(name, icarous(y/n), lat, lng))
            E.createNewAircraftFile(a_list[1], a_list[2], parseFloat(a_list[3]), parseFloat(a_list[4]))
            console.log('Waiting for AC Startup.')
            break;

        case 'forward':
            console.log(`Forwarding ${a_list[1]} data to ${a_list[2]} on port ${a_list[3]}`)
            E.scriptForwardData(a_list[1], a_list[2], a_list[3], a_list[4])
            break;

        case 'wp':
            // expected format - ['wp', 'load', id, 'path/to/file.txt']
            // open the file
            let allText;
            let rawFile = new XMLHttpRequest() // This is depreciated will have to find a fix in the future
            rawFile.open('GET', a_list[2], false)
            rawFile.onreadystatechange = function () {
                if (rawFile.readyState === 4) {
                    if (rawFile.status === 200) {
                        allText = rawFile.responseText
                    }
                }
            }
            rawFile.send(null);
            let text = allText.split('\n')
            let clean_text = []
            for (let item of text) {
                item = item.split('\t')
                clean_text.push(item)
            }

            // seq, ignore, ignore, command, ignore, ignore, ignore, ignore, lat, lng, alt
            let vel
            let wp_string = ''
            // format for curent LOAD_FLIGHTPLAN message
            for (let item of clean_text) {
                if (item.length == 12) {
                    // ignore 0.000 lat or long
                    if (parseFloat(item[8]) == 0.0 || parseFloat(item[9]) == 0.0) {
                        vel = item[5]
                    } else {
                        wp_string = `${wp_string}${item[8]} ${item[9]} ${item[10]} `
                    }
                }
            }
            ac = AM.getAircraftByName(a_list[1])

            // send the message
            E.scriptSubmitFlightPlan(ac, vel, `${wp_string} `)

            // request the wp's from the ac to update the display
            C.sendFullMessage(`AIRCRAFT ${ac.id} REQUEST_WAYPOINTS ${ac.id}`);

            break;

        case 'geofence':
            // expected format - ['geofence', 'load', id, fence_id, 'path/to/file.xml']
            ac = AM.getAircraftByName(a_list[1])

            // load the file
            C.sendFullMessage(`AIRCRAFT ${ac.id} LOAD_GF_FILE ../../${a_list[3]}`)

            // submit the fence to ac

            let x = true
            setTimeout(() => {
                try {

                    for (let f of ac.gf_list) {
                        let m = `LOAD_GEOFENCE AC_ID ${ac.id} F_ID ${parseInt(f.id)} TYPE ${parseInt(f.type)} FLOOR ${parseInt(f.floor)} ROOF ${parseInt(f.roof)}`
                        for (let p of f.point_list) {
                            m = `${m} ${p.lat} ${p.lng}`
                        }

                        C.sendFullMessage(`AIRCRAFT ${ac.id} ${m}`)

                        // update fence and status
                        f.submitted = true;
                        G.updateFenceSummaryPanel()

                        // redraw the fence lines
                        G.drawGeofences()
                    }

                } catch (e) {
                    console.log(e)
                }
            }, 7000)

            break;

        case 'time':
            // expected format - ['time', 'wait', num]
            setTimeout(console.log(`Wait ${line[1]}`), parseInt(line[2]) * 1000)
            break;

        case 'long':
            // expected format - ['long', 'MISSION_START', id]
            ac = AM.getAircraftByName(a_list[1])
            E.sendStartFlight(ac)

            break;

        case 'traffic':
            if (a_list[0] == 'add') {
                // expected format: a_list - ['add', id, t_id, lat, lng, range, bearing, alt, gs, hdg, vs, emit]
                let ac = AM.getAircraftByName(a_list[1])

                // send the message
                C.sendFullMessage(`AIRCRAFT ${ac.id} ADD_TRAFFIC ${a_list[2]} ${a_list[3]} ${a_list[4]} ${a_list[5]} ${a_list[6]} ${a_list[7]} ${a_list[8]} ${a_list[9]} ${a_list[10]} ${a_list[11]} ${a_list[2]}`
                )

            } else if (a_list[0] == 'file') {
                // expected format - [file, id, t_id, filename]
                let ac = AM.getAircraftByName(a_list[1])
                C.sendFullMessage(`AIRCRAFT ${ac.id} FILE_TRAFFIC ${a_list[2]} /${a_list[3]}`)

            } else if (a_list[0] === 'remove') {
                // expected format - [remove, id, t_id]
                let ac = AM.getAircraftByName(a_list[1])
                let t_id = a_list[2]
                C.sendFullMessage(`AIRCRAFT ${ac.id} REMOVE_TRAFFIC ${a_list[2]}`)
            }
            break;
        case 'comment':
            // update banner
            let b_t = document.getElementById('b_text')
            b_t.innerHTML =` Fly by File in progress. Completed ${line[1]} of ${line[2]} flights.`
            break;

        case 'stop':
            // expected format: line - ['stop', 'ac'], or ['stop', 'all']

            if (line[1] == 'all') {
                let ac_list = AM.getAircraftList()
                ac_list.forEach(el => {
                    E.acShutdown(el)
                });
            } else {
                try {
                    let ac_name = line[1]
                    let ac = AM.getAircraftByName(ac_name)
                    E.acShutdown(ac)
                } catch (e) {
                    console.log('Aircraft not found.', line, e)
                    return
                }
            }
            break;

        case 'END':
            console.log('End of Script')
            MODE.flybyfile = false
            break;
    }
}
