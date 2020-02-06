/**
 *
 * @module Aircraft
 * @version 1.0.0
 * @description <b> Aircraft module </b>
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

import * as B from './bands.js'

export class Aircraft {
    /**
     * @function <a name="Aircraft">Aircraft</a>
     * @description Constructor.
     * @param ac_id {string} aircraft id
     * @param aircraft_list {Array} list of aircraft objects
     * @param fp {Array} flight plan, list of waypoint objects
     * @memberof module:Aircraft
     * @class Aircraft
     * @instance
     */
    constructor(ac_id, aircraft_list, fp) {
        this.id = ac_id;
        this.name = ac_id;
        this.aircraft_list = aircraft_list;
        this.flightplan = fp;
        this.replan = []
        this.rec_fp = [];
        this.rec_fp_len = 0;
        this.type = 'RotorSim';
        this.parameters = []; // {name: name, value:value, type:type, index:index}

        this.lat = 0;
        this.lng = 0;
        this.alt = 10;
        this.vel = 3;
        this.u_alt = 10;
        this.u_vel = 3;

        this.rel_alt = 0;
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.hdg = 0;
        this.roll = 0;
        this.pitch = 0;
        this.yaw = 0;
        this.rollSpeed = 0;
        this.pitchSpeed = 0;
        this.yawSpeed = 0;
        this.voltage = 0;
        this.current = 0;
        this.gps_status = false;
        this.battery_remaining = 0
        this.radio_percent = 0
        this.radio_missing = 0
        this.satellites_visible = 0

        this.clicked = false;

        this.status = 0; //  0 = planning, 1 = pre-flight, 2 = in-flight, 3 = post-flight
        this.mode = '' // sitl, hitl, playback
        this.flightmode = 'UNKNOWN' // stablized, guided,... armed/disarmed
        this.icflightmode = 'UNKNOWN'
        this.stopCalled = false
        this.hasComms = false;

        this.flightplanLine = null;
        this.replanLine = null
        this.icon = 1;
        this.acMarker = 1;
        this.start = 'Unknown';
        this.prev_pos = []; // stores the trailing dots
        this.pos_update_counter = 0; // update the trailing dots

        this.prev_panel = null; // inFlight_pan, info_pan, pan
        this.activeView = false; // are the panels currently in view
        this.activeSubPanels = []; // list of panels to make active if activeView == true

        this.icarous = 1;
        this.ic_control = false;
        this.set_recieved = false

        this.bands = new B.Bands()
        this.band_markers = [];
        this.ic_radius = null;
        this.icRad = 0;
        this.ic_last = null
        this.traffic_list = [];
        this.gf_list = []
        this.gf_submitted = []
        this.showBands = true;
        this.ditchSite = null
        this.schedule_zone = 0
        this.entry_radius = 0
        this.coord_zone = 0
        this.mission_current = 0
        this.small = null
        this.med = null
        this.large = null

        this.forwarding = false; // forwarding raw data to somewhere else
        this.f_ip = '146.165.72.2'
        this.f_port = '14550'
        this.f_baud = '56700'

        this.acIconList = [
            'images/quad_red.svg', // Active ac
            'images/quad_blue.svg', // All other ac
            'images/quad_green.svg',
            'images/quad_yellow.svg',
            'images/quad_purple.svg',
        ]
    }

    flightplanToString() {
        // let out = ' ' + ac.flightplan[0].latlng.lat.toString() + ' ' + ac.flightplan[0].latlng.lng.toString() + ' ' + ac.flightplan[0].alt.toString() + ' '
        let out = ' '
        for (let item of this.flightplan) {
            out = out + item.latlng.lat.toString() + ' ' + item.latlng.lng.toString() + ' ' + item.alt.toString() + ' '
        }
        return out
    }

}