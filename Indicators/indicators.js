/**
 *
 * @module indicators
 * @version 1.0.0
 * @description <b> Library of Indicator functions. </b>
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


import * as comms from '../MainJS/comms.js';
import * as Aircraft from '../MainJS/aircraft.js';

export class Indicators {
    constructor(id) {
        this.id = id;
        this.show = false;
        this.size = window.innerWidth / 14.3;
        this.dir = 'jQuery-Flight-Indicators/img/'
        this.att_indicator = $.flightIndicator('#attitude_' + id, 'attitude', {
            size: this.size,
            showBox: true,
            img_directory: this.dir
        });
        this.alt_indicator = $.flightIndicator('#altimeter_' + id, 'altimeter', {
            size: this.size,
            showBox: true,
            img_directory: this.dir
        });
        this.hdg_indicator = $.flightIndicator('#heading_' + id, 'heading', {
            size: this.size,
            heading: 0,
            showBox: true,
            img_directory: this.dir
        });
        this.vari_indicator = $.flightIndicator('#variometer_' + id, 'variometer', {
            size: this.size,
            vario: -5,
            showBox: true,
            img_directory: this.dir
        });
        this.airspeed_indicator = $.flightIndicator('#airspeed_' + id, 'airspeed', {
            size: this.size,
            showBox: true,
            img_directory: this.dir
        });
        this.gps_indicator = addGpsIndicator();
        this.battery_indicator = addBatteryIndicator();
        this.radio_indicator = addRadioIndicator()

        function addGpsIndicator() {
            let div = document.createElement('div')
            div.setAttribute('class', 'indicator_icons')
            let im = document.createElement('IMG');
            im.setAttribute("id", "gps_" + id);
            im.setAttribute("src", "Indicators/images/gps.svg");
            im.setAttribute('class', 'red')
            let inner = document.createElement('div')
            inner.setAttribute('id', 'gps_text_' + id)
            inner.innerText = '0'
            div.appendChild(im)
            div.appendChild(inner)
            document.getElementById('gps_status_' + id).appendChild(div);
        }

        function addBatteryIndicator() {
            let div = document.createElement('div')
            div.setAttribute('class', 'indicator_icons')
            let im = document.createElement('IMG');
            im.setAttribute("id", "battery_" + id);
            im.setAttribute("src", "Indicators/images/battery.svg");
            im.setAttribute('class', 'red')
            let inner = document.createElement('div')
            inner.setAttribute('id', 'battery_text_' + id)
            inner.innerText = '0'
            div.appendChild(im)
            div.appendChild(inner)
            document.getElementById('gps_status_' + id).appendChild(div);
        }

        function addRadioIndicator() {
            let div = document.createElement('div')
            div.setAttribute('class', 'indicator_icons')
            let im = document.createElement('IMG')
            im.setAttribute('id', 'radio_' + id)
            im.setAttribute('src', 'Indicators/images/media-signal-tower-svgrepo-com.svg')
            im.setAttribute('class', 'red')
            let inner = document.createElement('div')
            inner.setAttribute('id', 'radio_text_' + id)
            inner.innerText = '0'
            div.appendChild(im)
            div.appendChild(inner)
            document.getElementById('gps_status_' + id).appendChild(div)
        }
    }
    addIndicatorsToAc(id) {
        let ac = Aircraft.getAircraftById(id)
        ac['indicators'] = this
    }
}


export function updateIndicators(ac) {
    // check if active and showing
    if (ac.activeView) {
        if (!ac.indicators.show) {
            makeIndicatorsActive()
        }
        // Sets the roll of an attitude indicator
        ac.indicators.att_indicator.setRoll(ac.roll);
        // Sets the pitch of an attitude indicator
        ac.indicators.att_indicator.setPitch(ac.pitch);
        // Sets the heading of an heading indicator
        ac.indicators.hdg_indicator.setHeading(ac.hdg);

        // need to convert vx and vy to v then convert to knots
        let speed = Math.hypot(ac.vx, ac.vy) * 1.94384;
        // Sets the speed of an airspeed indicator
        ac.indicators.airspeed_indicator.setAirSpeed(speed);
        // Sets the altitude of an altimeter indicator
        ac.indicators.alt_indicator.setAltitude(ac.rel_alt * 3.28084);


        let ind = document.getElementById('battery_text_' + ac.id)
        ind.innerText = ac.battery_remaining + '%'

        let inner = document.getElementById('radio_text_' + ac.id)
        inner.innerText = ac.radio_percent + '%,  ' + ac.radio_missing + '%'

        let indi = document.getElementById('gps_text_' + ac.id)
        indi.innerText = ac.satellites_visible

        // I left the optional functions in incase we decide to use them
        // will have to calculate
        //indicator.setVario(vario);		// Sets the climb speed of an variometer indicator
        //indicator.setPressure(pressure);	// Sets the pressure of an altimeter indicator
        //indicator.resize(size);			// Sets the size of any indicators
        //indicator.showBox();				// Make the outer squared box of any instrument visible
        //indicator.hideBox();				// Make the outer squared box of any instrument invisible
    }
}


export function addNewIndicators(id) {
    // check to see if new indicators are needed
    let ind = document.getElementById('indicators_' + id)
    if (!ind) {
        let panel = document.getElementsByTagName('body')
        panel = panel[0]
        let ind_list = [
            "attitude",
            "altimeter",
            "heading",
            "airspeed",
            "gps_status"
        ]

        // create a div
        let div_ind = document.createElement('div')
        div_ind.setAttribute('id', 'indicators_' + id)
        div_ind.setAttribute('class', 'indicators hide')
        panel.appendChild(div_ind)

        // create spans for each indicator
        let s;
        for (let item of ind_list) {
            s = document.createElement('span')
            s.setAttribute('id', item + '_' + id)
            if (item == 'gps_status') {
                s.setAttribute('class', 'gps')
            }
            div_ind.appendChild(s)
        }

        // create the indicators
        let ind = new Indicators(id)
        ind.addIndicatorsToAc(id)

    }
    makeIndicatorsActive()

}

// any click event that changes panel has to call changeAC
// map acIcon
// menu ac button
// panel create - calls from acModeCheck
// going to have to do the hide/show thing remove and recreate is getting too messy

export function removeIndicators(id) {
    // remove old indicators
    try {
        let ind = document.getElementsByClassName('indicators')
        for (let item of ind) {
            // check if id == new id
            for (let i = item.childNodes; i >= 0; i--) {
                item.removeChild(item.lastChild)
            }
            item.parentNode.removeChild(item)
        }
    } catch (e) {
        console.log('Unable to find indicators.', e)
    }
}

export function makeIndicatorsActive() {
    // hide all indicators
    let indicators = document.getElementsByClassName('indicators')
    for (let item of indicators) {
        item.classList.replace('show', 'hide')
    }
    // check which ac is active
    let ac_list = comms.getAircraftList()
    for (let ac of ac_list) {
        if (ac.activeView) {
            ac.indicators.show = true
            // show the correct indicators
            let ind = document.getElementById('indicators_' + ac.id)
            if (ind != null) {
                ind.classList.replace('hide', 'show')
            }
        } else {
            ac.indicators.show = false
            let ind = document.getElementById('indicators_' + ac.id)
            if (ind != null) {
                ind.classList.replace('show', 'hide')
            }
        }
    }
}


export function resizeWindow() {
    let size = window.innerWidth / 14.3
    let ac_list = comms.getAircraftList()
    let dir = 'jQuery-Flight-Indicators/img/'
    ac_list.forEach(function (el) {
        el.att_indicator = $.flightIndicator('#attitude_' + el.id, 'attitude', {
            size: size,
            showBox: true,
            img_directory: dir
        });
        el.alt_indicator = $.flightIndicator('#altimeter_' + el.id, 'altimeter', {
            size: size,
            showBox: true,
            img_directory: dir
        });
        el.hdg_indicator = $.flightIndicator('#heading_' + el.id, 'heading', {
            size: size,
            heading: 0,
            showBox: true,
            img_directory: dir
        });
        el.vari_indicator = $.flightIndicator('#variometer_' + el.id, 'variometer', {
            size: size,
            vario: -5,
            showBox: true,
            img_directory: dir
        });
        el.airspeed_indicator = $.flightIndicator('#airspeed_' + el.id, 'airspeed', {
            size: size,
            showBox: true,
            img_directory: dir
        });
    })
}