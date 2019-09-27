/**
 *
 * @class Playground
 * @version 1.0.0
 * @description <b> Controler for DAA Display</b>
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

class Playground {
    constructor(displayWidgets) {

        this.playground = displayWidgets;
        let _this = this;
        _this.playground.map.revealTraffic()
        _this.playground.map.showTraffic(true)
        $("#compass-resolution-bug").css("display", "block");
        $("#map-canvas").css("opacity", 0.5);
        _this.playground.airspeed.setStep(.1);
        _this.playground.vspeed.setStep(.5);
        _this.playground.altitude.setStep(100);

        setInterval(function () {

            let ac = _this.playground.comms.getActiveAC()
            if (ac != 'Aircraft Not Found') {
                // Map
                _this.playground.map.setPosition({
                    lat: ac.lat,
                    lon: ac.lng
                })
                _this.playground.map.setHeading(ac.hdg)

                if (ac.traffic_list.length > 0) {
                    let des_list = []
                    ac.traffic_list.forEach(element => {
                        des_list.push(element.descriptor)
                    })
                    _this.playground.map.setTrafficPosition(des_list)
                }

                // Altitude
                _this.playground.altitude.setAltitude(ac.rel_alt, 'meters')
                // _this.playground.altitude.setBands()

                // Compass
                _this.playground.compass.setCompass(ac.hdg);
                _this.playground.compass.setBug(((Math.atan2(ac.vy, ac.vx)) * 180 / Math.PI));
                // FAR: [{from: deg, to: deg}], MID: [{from: deg, to: deg}], NEAR: [{from: deg, to: deg}], RECOVERY: [{from: deg, to: deg}], UNKNOWN: [{from: deg, to: deg}], NONE: [{from: deg, to: deg}]
                _this.playground.compass.setBands(ac.bands)

                // Speed
                _this.playground.airspeed.setAirSpeed(Math.hypot(ac.vx, ac.vy), 'msec')
                // _this.playground.airspeed.setBands()
                _this.playground.vspeed.setVerticalSpeed(ac.vz, 'msec');

                // Horizon
                _this.playground.vhorizon.setRoll(ac.roll);
                _this.playground.vhorizon.setPitch(ac.pitch);
            }

        }, 500)
    }
}