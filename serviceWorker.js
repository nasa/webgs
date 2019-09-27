/**
 *
 * @module eventFunctionsTraffic
 * @version 1.0.0
 * @description <b> Allows for cacheing files. Usefull when internet access is itermitent. Not turned on by default. </b>
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


self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open('WebGS').then(function (cache) {
            return cache.addAll([
                // '/',
                // '/index.html',
                // '/PublicCSS/index.css',
                // '/PublicJS/comms.js',
                // '/PublicJS/map.js',
                // '/PublicJS/gcsmode.js',
                // '/PublicJS/form.js',
                // '/PublicJS/eventFunctions.js',
                // '/PublicJS/aircraft.js',
                // '/images/battery.svg',
                // '/images/black_marker.svg',
                // '/images/gear.png',
                // '/images/gps.svg',
                // '/images/quadcopter.png',
                // '/images/red_marker.svg',
                // '/Leaflet.contextmenu/dist/leaflet.contextmenu.css',
                // 'Leaflet.contextmenu/dist/leaflet.contextmenu.js',
                // 'Leaflet-semicircle/Semicircle.js',
                // 'jQuery-Flight-Indicators/css/flightindicators.css',
                // 'jQuery-Flight-Indicators/js/jquery.flightindicators.js',
                // '/jQuery-Flight-Indicators/img/fi_box.svg',
                // '/jQuery-Flight-Indicators/img/horizon_back.svg',
                // '/jQuery-Flight-Indicators/img/horizon_ball.svg',
                // '/jQuery-Flight-Indicators/img/horizon_circle.svg',
                // '/jQuery-Flight-Indicators/img/horizon_mechanics.svg',
                // '/jQuery-Flight-Indicators/img/fi_circle.svg',
                // '/jQuery-Flight-Indicators/img/altitude_pressure.svg',
                // '/jQuery-Flight-Indicators/img/altitude_ticks.svg',
                // '/jQuery-Flight-Indicators/img/fi_needle_small.svg',
                // '/jQuery-Flight-Indicators/img/fi_needle.svg',
                // '/jQuery-Flight-Indicators/img/heading_yaw.svg',
                // '/jQuery-Flight-Indicators/img/heading_mechanics.svg',
                // '/jQuery-Flight-Indicators/img/speed_mechanics.svg'

            ]);
        })
    )
})


self.addEventListener('fetch', function (event) {
    // console.log(event.request.url);
    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
})