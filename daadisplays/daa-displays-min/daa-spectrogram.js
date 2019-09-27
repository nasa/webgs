/**
 * @module DAASpectrogram
 * @version 2018.12.01
 * @description <div style="display:flex;"><div style="width:50%;">
 *              <b>DAA Spectrogram.</b>
 *              <p>Graphics library for plotting resolution bands in a spectrogram.
 *              The x axis of the spectrogram represents the time dimension.
 *              The y axis represents the band type.</p></div>
 *              <img src="images/daa-spectrogram.png" style="margin-left:8%; max-height:207px;" alt="DAA Spectrogram"></div>
 * @example
// file index.js (to be stored in pvsio-web/examples/demos/daa-displays/)
require.config({
    paths: { 
        widgets: "../../client/app/widgets",
        text: "../../client/app/widgets/daa-displays/lib/text/text"
    }
});
require(["widgets/daa-displays/daa-sspectrogram"], function (DAASpectrogram) {
    "use strict";
    const spectrogram = new DAASpectrogram("track-bands");
    spectrogram.plot({
        ...
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
 * @date December 2018
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
define(function (require, exports, module) {
    "use strict";
    require("widgets/daa-displays/daa-utils");
    const spectrogramTemplate = require("text!widgets/daa-displays/templates/daa-spectrogram.handlebars");
    const spectrogramBandTemplate = require("text!widgets/daa-displays/templates/daa-spectrogram-band.handlebars");

    // data is an object { width: real, height: real, length: nat }
    function createGrid (data) {
        let barWidth = data.width / data.length;
        let grid = [];
        for (let i = 0; i < data.length; i++) {
            grid.push({
                left: i * barWidth,
                height: data.height,
                width: barWidth
            });
        }
        return grid;
    }

    // utility function for converting values between units
    function convert (val, unitsFrom, unitsTo) {
        if (unitsFrom === "rad" && unitsTo === "deg") { return parseFloat(rad2deg(val).toFixed(2)); }
        if (unitsFrom === "msec" && unitsTo === "knots") { return parseFloat(msec2knots(val).toFixed(2)); }
        if (unitsFrom === "meters" && unitsTo === "feet") { return parseFloat(meters2feet(val).toFixed(2)); }
        if (unitsFrom === "mpm" && unitsTo === "fpm 100x") { return parseFloat(meters2feet(val).toFixed(2) / 100); }
        return parseFloat(parseFloat(val).toFixed(2));
    }

    // utility function for compiling the HTML element of the spectrogram
    function compileHTML (_this, opt) {
        opt = opt || {};
        let grid = createGrid({
            width: _this.width, 
            height: _this.height, 
            length: _this.length
        });
        return Handlebars.compile(spectrogramTemplate)({
            id: _this.id,
            zIndex: 2,
            grid: grid,
            cursor: {
                height: _this.height + 25,
                width: (_this.width / _this.length) - 1
            },
            top: _this.top,
            left: _this.left,
            width: _this.width,
            height: _this.height,
            label: _this.label,
            min: _this.range.min,
            max: _this.range.max,
            units: _this.units.to
        });
    }

    class DAASpectrogram {
        /**
         * @function <a name="DAASpectrogram">DAASpectrogram</a>
         * @description Constructor.
         * @param id {String} Unique plot identifier.
         * @param coords {Object} The four coordinates (top, left, width, height) of the plot, specifying
         *        the left/top corners, and the width/height of the (rectangular) widget area.
         *        Default is { top: 0, left: 0, width: 800, height: 80 }.
         * @param opt {Object} Style options defining the visual appearance of the plot.
         *          <li>range (Object({ min: real, max: real })): range of values to be plotted.</li>
         *          <li>length (nat): temporal length of the spectrogram, i.e., number of time instants represented in the spectrogram.</li>
         *          <li>parent (String): the HTML element where the plot will be appended (default is "body")</li>
         * @memberof module:DAASpectrogram
         * @instance
         */
        constructor (id, coords, opt) {
            this.id = id || "plot";
            this._timeseries = []; // used for storing historical plot data
            coords = coords || {};
            this.top = coords.top || 0;
            this.left = coords.left || 0;
            this.width = coords.width || 800;
            this.height = coords.height || 80;
            this.range = {
                min: (opt.range && opt.range.min) ? opt.range.min : 0,
                max: (opt.range && opt.range.max) ? opt.range.max : 100
            };
            opt = opt || {};
            this.length = opt.length || 10;
            this.units = opt.units || { from: "deg", to: "deg" };
            this.label = (opt.label) ? { 
                top: (typeof opt.label === "string") ? opt.label : opt.label.top,
                left: (typeof opt.label === "object") ? opt.label.left : null,
            } : { top: null, left: null };
            this.div = createDiv(id, { parent: opt.parent, zIndex: 2, top: this.top, left: this.left });
            let theHTML = compileHTML(this, opt);
            $(this.div).html(theHTML);
        }
        /**
         * @function <a name="setLength">setLength</a>
         * @description Defines the temporal length of the spectrogram, i.e., the number of time instants represented in the spectrogram.
         * @param length {nat} The length of the spectrogram.
         * @memberof module:DAASpectrogram
         * @instance
         */
        setLength(length) {
            if (length) {
                this.length = length;
                let theHTML = compileHTML(this);
                $(this.div).html(theHTML);
            }
            return this;
        }
        /**
         * @function <a name="plot">plot</a>
         * @description Plot function, for rendering resolution bands in the spectrogram.
         * @param data {Object({ bands: Object, step: nat })} Resolution bands data
         *              <li>bands: Object in the form { b1: range1, b2: range2, ... }, where b1, b2, ... are band names (e.g,. NEAR, FAR, etc) and range1, range2, ... are range objects { from: nat, to: nat }</li>
         *              <li>step: the temporal step to be plotted</li>
         * @memberof module:DAASpectrogram
         * @instance
         */
        plot (data) {
            if (data && data.bands) {
                this._timeseries.push(data.bands);
                let _this = this;
                let band_plot_data = {};
                let yScaleFactor = this.height / (this.range.max - this.range.min);
                Object.keys(data.bands).forEach(function (alert) {
                    band_plot_data[alert] = [];
                    data.bands[alert].forEach(function (range) {
                        let from = convert(range.from, _this.units.from, _this.units.to);
                        let to = convert(range.to, _this.units.from, _this.units.to);
                        let height = to - from;
                        band_plot_data[alert].push({
                            from: from,
                            to: to, 
                            color: bandColors[alert].color,
                            dash: bandColors[alert].style === "dash",
                            top: (_this.range.max - to) * yScaleFactor,
                            height: height * yScaleFactor,
                            units: _this.units.to
                        });
                    });
                });
                
                let stepID = this.id + "-step-" + data.step;
                let barWidth = this.width / this.length;
                let leftMargin = data.step * barWidth;
                let theHTML = Handlebars.compile(spectrogramBandTemplate)({
                    id: this.id,
                    stepID: stepID,
                    zIndex: 2,
                    step: data.step,
                    bands: band_plot_data,
                    top: this.top,
                    left: leftMargin,
                    width: barWidth,
                    height: this.height
                });
                $("#" + stepID).remove();
                $("#" + this.id + "-spectrogram-data").append(theHTML);
                $("#" + this.id + "-cursor").css("left", leftMargin );
                $('[data-toggle="tooltip"]').tooltip(); // this activates tooltips
            }
            return this;
        }
    }

    module.exports = DAASpectrogram;
});