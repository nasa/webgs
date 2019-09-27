/**
 * @module AirspeedTape
 * @version 2018.12.01
 * @description <div style="display:flex;"><div style="width:50%;">
 *              <b>Airspeed tape widget.</b>
 *              <p>The tape display consists of a graduated linear string that
 *              scrolls vertically when the display value changes and an indicator pointing at
 *              the current value. A framed box placed next to the indicator embeds a digital
 *              display showing the current value in numeric form. A small graduated linear
 *              string is used for the least significant digit of the digital display.
 *              The tape unit is 20 knot.</p>
 *              <p>This implementation requires the installation of the pvsio-web toolkit
 *              (<a href="http://www.pvsioweb.org" target=_blank>www.pvsioweb.org</a>).</p>
 *              <p>Google Chrome is recommended for correct rendering of the widget.</p></div>
 *              <img src="images/daa-airspeed-tape.png" style="margin-left:8%; max-height:250px;" alt="DAA Airspeed Tape Widget"></div>
 * @example
// file index.js (to be stored in pvsio-web/examples/demos/daa-displays/)
require.config({
    paths: {
        widgets: "../../client/app/widgets",
        text: "../../client/app/widgets/daa-displays/lib/text/text"
    }
});
require(["widgets/daa-displays/daa-airspeed-tape"], function (AirspeedTape) {
    "use strict";
    const airSpeedTape = new AirspeedTape("airspeed", {
        top: 100, left: 100
    });
    airSpeedTape.setAirSpeed(300);
    airSpeedTape.setBands({
        RECOVERY: [ { from: 0, to: 300 } ],
        NEAR: [ { from: 300, to: 600 } ]
    });
});

// file index.html (to be stored in pvsio-web/examples/demos/daa-displays/)
<!DOCTYPE HTML>
<html>
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible">
        <title></title>
        <meta name="viewport" content="width=device-width">
        <link rel="stylesheet" href="../../client/app/widgets/daa-displays/lib/bootstrap/4.1.3/css/bootstrap.min.css">
        <link rel="stylesheet" href="../../client/app/widgets/daa-displays/lib/font-awesome/5.6.1/css/all.min.css">
        <link rel="stylesheet" href="../../client/app/widgets/daa-displays/css/daa-displays.css">
    </head>
    <script src="../../client/app/widgets/daa-displays/lib/underscore/underscore.js"></script>
    <script src="../../client/app/widgets/daa-displays/lib/jquery/jquery-3.3.1.slim.min.js"></script>
    <script src="../../client/app/widgets/daa-displays/lib/popper/popper-1.14.3.min.js"></script>
    <script src="../../client/app/widgets/daa-displays/lib/bootstrap/4.1.3/bootstrap.min.js"></script>
    <script src="../../client/app/widgets/daa-displays/lib/handlebars/handlebars-v4.0.12.js"></script>
    <script src="../../client/app/widgets/daa-displays/lib/requireJS/require.js" data-main="index.js"></script>
</html>

 * @author Paolo Masci
 * @date October 2018
 * @copyright
 * Copyright 2016 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration. No
 * copyright is claimed in the United States under Title 17,
 * U.S. Code. All Other Rights Reserved.
 * <br>
 * Disclaimers
 * <br>
 * No Warranty: THE SUBJECT SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY
 * WARRANTY OF ANY KIND, EITHER EXPRESSED, IMPLIED, OR STATUTORY,
 * INCLUDING, BUT NOT LIMITED TO, ANY WARRANTY THAT THE SUBJECT SOFTWARE
 * WILL CONFORM TO SPECIFICATIONS, ANY IMPLIED WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR FREEDOM FROM
 * INFRINGEMENT, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL BE ERROR
 * FREE, OR ANY WARRANTY THAT DOCUMENTATION, IF PROVIDED, WILL CONFORM TO
 * THE SUBJECT SOFTWARE. THIS AGREEMENT DOES NOT, IN ANY MANNER,
 * CONSTITUTE AN ENDORSEMENT BY GOVERNMENT AGENCY OR ANY PRIOR RECIPIENT
 * OF ANY RESULTS, RESULTING DESIGNS, HARDWARE, SOFTWARE PRODUCTS OR ANY
 * OTHER APPLICATIONS RESULTING FROM USE OF THE SUBJECT SOFTWARE.
 * FURTHER, GOVERNMENT AGENCY DISCLAIMS ALL WARRANTIES AND LIABILITIES
 * REGARDING THIRD-PARTY SOFTWARE, IF PRESENT IN THE ORIGINAL SOFTWARE,
 * AND DISTRIBUTES IT "AS IS."
 * <br>
 * Waiver and Indemnity: RECIPIENT AGREES TO WAIVE ANY AND ALL CLAIMS
 * AGAINST THE UNITED STATES GOVERNMENT, ITS CONTRACTORS AND
 * SUBCONTRACTORS, AS WELL AS ANY PRIOR RECIPIENT.  IF RECIPIENT'S USE OF
 * THE SUBJECT SOFTWARE RESULTS IN ANY LIABILITIES, DEMANDS, DAMAGES,
 * EXPENSES OR LOSSES ARISING FROM SUCH USE, INCLUDING ANY DAMAGES FROM
 * PRODUCTS BASED ON, OR RESULTING FROM, RECIPIENT'S USE OF THE SUBJECT
 * SOFTWARE, RECIPIENT SHALL INDEMNIFY AND HOLD HARMLESS THE UNITED
 * STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY
 * PRIOR RECIPIENT, TO THE EXTENT PERMITTED BY LAW.  RECIPIENT'S SOLE
 * REMEDY FOR ANY SUCH MATTER SHALL BE THE IMMEDIATE, UNILATERAL
 * TERMINATION OF THIS AGREEMENT.
 **/
/*jslint esnext: true */
/*global _, bandColors, createDiv, msec2knots, rad2deg, fixed3 */
define(function (require, exports, module) {
    "use strict";
    require("daadisplays/daa-displays-min/daa-utils");
    require("daadisplays/daa-displays-min/templates/daa-airspeed-templates.js");
    // const airspeedTemplate = require("text!daa-displays-min/templates/daa-airspeed.handlebars");
    // const airspeedTicksTemplate = require("text!daa-displays-min/templates/daa-airspeed-ticks-template.handlebars");
    // const airspeedBandsTemplate = require("text!daa-displays-min/templates/daa-linear-bands-template.handlebars");

    // utility function for creating airspeed tick marks
    function _create_airspeed_ticks(_this) {
        let ticks = [];
        let tickValues = [];
        let n = _this.nAirspeedTicks + _this.trailerTicks;
        let maxAirspeedValue = (_this.nAirspeedTicks - 1) * 2 * _this.airspeedStep;
        for (let i = 0; i < n; i++) {
            ticks.push({
                top: _this.tickHeight * 2 * i
            });
            if (i < _this.nAirspeedTicks) {
                let val = maxAirspeedValue - i * 2 * _this.airspeedStep;
                if (val === 0) {
                    tickValues.push("00");
                } else {
                    tickValues.push(val);
                }
            }
        }
        let airspeedTicks = Handlebars.compile(airspeedTicksTemplate)({
            ticks: ticks,
            id: _this.id
        });
        let airspeedValues = tickValues.join("<br>");
        $("#" + _this.id + "-ticks").html(airspeedTicks);
        $("#" + _this.id + "-tick-values").html(airspeedValues);
        $("." + _this.id + "-rule").each(function () {
            $(this).css("height", (n * _this.tickHeight * 2) + "px");
        });
    }
    // utility function for creating airspeed spinner
    function _create_airspeed_spinner(_this) {
        const base = ["9", "8", "7", "6", "5", "4", "3", "2", "1", "0"];
        let maxAirspeedValue = (_this.nAirspeedTicks - 1) * _this.airspeedStep;
        let reps = maxAirspeedValue / 10;
        let spinner = base.join(" ");
        for (let i = 0; i < reps; i++) {
            spinner += " " + base.join(" ");
        }
        $("#" + _this.id + "-indicator-spinner").html(spinner);
    }
    // utility function for drawing resolution bands
    function _draw_bands(_this) {
        let theHTML = "";
        _.each(_this.bands, function (segments, alert) {
            // console.log(segments);
            let segs = [];
            for (let i = 0; i < segments.length; i++) {
                // compute the hight of the segment
                let height = (segments[i].to - segments[i].from) / _this.airspeedStep * _this.tickHeight;
                // place the segment in the right place on the tape
                segs.push({
                    top: (_this.tapeLength - _this.tickHeight) - (segments[i].from / _this.airspeedStep * _this.tickHeight) - height,
                    left: 84,
                    from: segments[i].from,
                    to: segments[i].to,
                    height: height,
                    id: _this.id + "-band-" + alert + "-" + i
                });
            }
            // console.log(segs);
            theHTML += Handlebars.compile(airspeedBandsTemplate)({
                segments: segs,
                color: bandColors[alert].color,
                dash: bandColors[alert].style === "dash"
            });
            // console.log(theHTML);
        });
        $("#" + _this.id + "-bands").html(theHTML);
    }
    // utility function for updating ground speed display (if any is rendered)
    function _updateGroundSpeed(_this) {
        // ground speed is obtained from airspeed and windspeed (groundspeed = currentAirspeed + windspeed)
        let gs = fixed3(Math.trunc(_this.currentAirspeed + _this.windSpeed)); // the indicator can render only integer numbers, and they have always 3 digits
        $("#" + _this.id + "-ground-speed").html(gs);
    }
    // utility function for updating true airspeed display (if any is rendered)
    function _updateTAS(_this) {
        let tas = fixed3(Math.trunc(_this.currentAirspeed + _this.windSpeed)); // FIXME: what is the formula???
        $("#" + _this.id + "-tas").html(tas);
    }
    // utility function for updating wind speed and direction (if any is rendered)
    function _updateWind(_this) {
        $("#" + _this.id + "-wind-direction").html(_this.windDirection);
        $("#" + _this.id + "-wind-speed").html(_this.windSpeed);
    }

    class AirspeedTape {
        /**
         * @function <a name="AirspeedTape">AirspeedTape</a>
         * @description Constructor.
         * @param id {String} Unique widget identifier.
         * @param coords {Object} The four coordinates (top, left, width, height) of the widget, specifying
         *        the left/top corners, and the width/height of the (rectangular) widget area.
         *        Default is { top: 103, left: 74, width: 92, height: 650 }.
         *        FIXME: The current implementation support only a fixed size, 92x650.
         * @param opt {Object} Style options defining the visual appearance of the widget.
         *          <li>airspeedStep (real): the airspeed step (default is 20 knots)</li>
         *          <li>parent (String): the HTML element where the widget will be appended (default is "body")</li>
         * @memberof module:AirspeedTape
         * @instance
         */
        constructor(id, coords, opt) {
            opt = opt || {};
            this.id = id || "daa-airspeed-tape";

            coords = coords || {};
            this.top = (isNaN(+coords.top)) ? 103 : +coords.top;
            this.left = (isNaN(+coords.left)) ? 74 : +coords.left;

            // airspeedStep is a parameter that can be specified using the options of the constructor
            this.airspeedStep = opt.airspeedStep || 20;

            // the following are constants, should not be modified (unless you know what you're doing!)
            this.nAirspeedTicks = 26;
            this.trailerTicks = 8;
            this.tickHeight = 54; //px
            this.tapeLength = 2808; //px, derived by inspecting the DOM for 400 ticks + 8 trailer ticks 81px height
            this.zero = -2454; // px, number of pixels necessary to reach value 0 in the spinner; this number was obtained by manually inspecting the DOM

            // create structure for storing resolution bands
            this.bands = {
                NONE: [],
                FAR: [],
                MID: [],
                NEAR: [],
                RECOVERY: [],
                UNKNOWN: []
            };

            // initialise airspeed and windspeed
            this.currentAirspeed = 0; // knots
            this.windSpeed = 0;
            // NOTE: groundspeed can be derived from airspeed and windspeed: groundSpeed = currentAirspeed + windspeed
            this.windDirection = 0;
            this.trueAirspeed = 0;

            // create DOM elements
            this.div = createDiv(id, {
                parent: opt.parent,
                zIndex: 2
            });
            let theHTML = Handlebars.compile(airspeedTemplate)({
                id: this.id,
                zIndex: 2,
                top: this.top,
                left: this.left
            });
            $(this.div).html(theHTML);
            _create_airspeed_ticks(this);
            _create_airspeed_spinner(this);
        }
        /**
         * @function <a name="setBands">setBands</a>
         * @description Renders airspeed resolution bands.
         *              Six types of resolution bands are supported:
         *              <li>FAR (dash yellow)</li>
         *              <li>MID (yellow)</li>
         *              <li>NEAR (red)</li>
         *              <li>RECOVERY (dash green)</li>
         *              <li>UNKNOWN (grey)</li>
         *              <li>NONE (transparent)</li>
         *              Band colors are defined in daa-utils.js
         * @param bands {Object} Bands to be rendered. This parameter is an object in the form { bandName: ranges },
         *                       where bandName is one of FAR, MID, NEAR, RECOVERY, UNKNOWN, NONE
         *                       and ranges is an Array of objects in the { from: real, to: real }.
         *                       Band range is given in knots.
         *                       Example bands: { RECOVERY: [ { from: 0, to: 300 } ], { NEAR: [ { from: 300, to: 600 } ] }
         * @param opt {Object} Options:
         *             <li>units (String): "msec", indicates that resolution bands are given in meters per seconds.
         *                                 The widget will automatically convert the bands to knots.</li>
         * @memberof module:AirspeedTape
         * @instance
         */
        setBands(bands, opt) {
            opt = opt || {};

            function normaliseAirspeedBand(b) {
                if (b && b.length > 0) {
                    return b.map(function (range) {
                        if (opt.units === "msec") {
                            // if bands are given in metres per second, we need to convert in knots
                            return {
                                from: msec2knots(range.from),
                                to: msec2knots(range.to)
                            };
                        }
                        return {
                            from: range.from,
                            to: range.to
                        };
                    });
                }
                return [];
            }
            this.bands.NONE = normaliseAirspeedBand(bands.NONE);
            this.bands.FAR = normaliseAirspeedBand(bands.FAR);
            this.bands.MID = normaliseAirspeedBand(bands.MID);
            this.bands.NEAR = normaliseAirspeedBand(bands.NEAR);
            this.bands.RECOVERY = normaliseAirspeedBand(bands.RECOVERY);
            this.bands.UNKNOWN = normaliseAirspeedBand(bands.UNKNOWN);
            // console.log(this.id + "-airspeed-bands", this.bands);
            _draw_bands(this);
            return this;
        }
        /**
         * @function <a name="setAirSpeed">setAirSpeed</a>
         * @description Sets the airspeed indicator to a given airspeed value.
         * @param val {real} Airspeed value. Default units is knots.
         * @param opt {Object} Options:
         *             <li>units (String): "msec", indicates that airspeed value is given in meters per seconds.
         *                                 The widget will automatically convert the value to knots.</li>
         *             <li>transitionDuration (string): duration of the scrolling animation of the display (default: 1000ms)</li>
         * @memberof module:AirspeedTape
         * @instance
         */
        setAirSpeed(val, opt) {
            opt = opt || {};
            val = limit(0, 300, "airspeed")(val); // the display range is 0..300
            this.currentAirspeed = (opt.units === "msec") ? msec2knots(parseFloat(val)) : parseFloat(val);

            let transitionDuration = opt.transitionDuration || "1000ms";
            let spinValueTranslation = this.zero + val * this.tickHeight / this.airspeedStep;
            spinValueTranslation = (spinValueTranslation > 0) ? 0 : spinValueTranslation;
            // FIXME: the spinner position drifts at when changing zoom level --- need to understand why and fix it!
            $("#" + this.id + "-spinner").css({
                "transition-duration": transitionDuration,
                "transform": "translateY(" + spinValueTranslation + "px)"
            });

            let stillDigits = Math.trunc(this.currentAirspeed / 10);
            stillDigits = (stillDigits < 10) ? "0" + stillDigits : stillDigits.toString();
            $("#" + this.id + "-indicator-still-digits").html(stillDigits);
            // with 26 ticks, max airspeed that can be displayed is 440
            let ratio = 34; // px, obtained by inspecting the DOM
            let spinIndicatorValue = this.currentAirspeed % 10;
            let spinGroup = Math.trunc(this.currentAirspeed / 10);
            let spinIndicatorTranslation = -17280 + (spinGroup * ratio * 10) + spinIndicatorValue * ratio; // -17280 is the number of pixels necessary to reach value 0 in the spinner; this number was obtained by manually inspecting the DOM
            $("#" + this.id + "-indicator-spinner").css({
                "transition-duration": "1000ms",
                "transform": "translateY(" + spinIndicatorTranslation + "px)"
            });

            // ground speed and true airspeed need to be updated every time we set air speed
            _updateGroundSpeed(this);
            _updateTAS(this);
            return this;
        }
        /**
         * @function <a name="getAirSpeed">getAirSpeed</a>
         * @description Returns the current airspeed value.
         * @return {real} The current airspeed value, in knots.
         * @memberof module:AirspeedTape
         * @instance
         */
        getAirSpeed() {
            return this.currentAirspeed;
        }
        /**
         * @function <a name="setWindDirection">setWindDirection</a>
         * @description Sets the wind direction.
         * @param deg {real} Wind direction. Default units is degrees.
         * @param opt {Object} Options:
         *             <li>units (String): "rad", indicates that wind direction is given in radians.
         *                                 The widget will automatically convert the value to degrees</li>
         * @memberof module:AirspeedTape
         * @instance
         */
        setWindDirection(deg, opt) {
            opt = opt || {};
            this.windDirection = (opt.units === "rad") ? rad2deg(parseFloat(deg)) : parseFloat(deg);
            _updateWind(this);
            // do we need to update airspeed??
            // return this.setAirSpeed(this.ground_speed - ???);
            return this;
        }
        /**
         * @function <a name="setWindSpeed">setWindSpeed</a>
         * @description Sets the wind speed value.
         * @param val {real} Wind speed. Default units is knots.
         * @param opt {Object} Options:
         *             <li>units (String): "msec", indicates that wind direction is given in meters per second.
         *                                 The widget will automatically convert the value to knots</li>
         * @memberof module:AirspeedTape
         * @instance
         */
        setWindSpeed(val, opt) {
            opt = opt || {};
            this.windSpeed = (opt.units === "msec") ? msec2knots(parseFloat(val)) : parseFloat(val);
            _updateWind(this);
            // ground speed and true airspeed need to be updated every time wind speed changes
            _updateGroundSpeed(this);
            _updateTAS(this);
            return this;
        }
        /**
         * @function <a name="setStep">setStep</a>
         * @description Sets the step value for the tape display.
         * @param val {real} Step size. Default units is knots. Default step size is 20 knots.
         * @memberof module:AirspeedTape
         * @instance
         */
        setStep(val) {
            if (isNaN(parseFloat(val))) {
                console.error("Warning: trying to set an invalid airspeed step", val);
                return this;
            }
            this.airspeedStep = parseFloat(val);
            _create_airspeed_ticks(this);
            _draw_bands(this);
            return this.setAirSpeed(this.currentAirspeed, {
                transitionDuration: "0ms"
            });
        }
        /**
         * @function <a name="getStep">getStep</a>
         * @description Returns the current step size.
         * @return {real} The current step size, in knots.
         * @memberof module:AirspeedTape
         * @instance
         */
        getStep() {
            return this.airspeedStep;
        }
    }
    module.exports = AirspeedTape;
});