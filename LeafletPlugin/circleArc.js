/**
 * @module L.circleArc
 * @version 1.0.1
 * @description <b> leaflet plugin </b>
 * @example none
 * @author Andrew Peters
 * @date Feb 2020
 * @copyright
 *
 * This is a striped down and modified version of:
 *
 * Semicircle extension for L.Circle.
 * Jan Pieter Waagmeester <jieter@jieter.nl>
 * https://github.com/jieter/Leaflet-semicircle/blob/master/Semicircle.js
 * LICENCE: https://github.com/jieter/Leaflet-semicircle/blob/master/LICENSE
 *
 * I needed something that would draw the arc and not the lines from the center
 * to the ends of the arc. I used the recomended Template for leaflet plugins,
 * updated the functions for my use case, and removed the extra stuff.
 *
 *  * Notices:
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


(function (factory, window) {

    // define an AMD module that relies on 'leaflet'
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory)

        // define a Common JS module that relies on 'leaflet'
    } else if (typeof exports === 'object') {
        module.exports = factory(require('leaflet'))
    }

    // attach your plugin to the global 'L' variable
    if (typeof window !== 'undefined' && window.L) {
        window.L.CircleArc = factory(L)
    }
}(function (L) {
    // make sure 0 degrees is up (North) and convert to radians.
    function fixAngle(angle) {
        return (angle - 90) * Math.PI / 180
    }

    // rotate point [x + r, y+r] around [x, y] by `angle` radians.
    function rotated(p, angle, r) {
        return p.add(
            L.point(Math.cos(angle), Math.sin(angle)).multiplyBy(r)
        )
    }

    L.Point.prototype.rotated = function (angle, r) {
        return rotated(this, angle, r)
    }

    let circleArc = {
        options: {
            startAngle: 0,
            stopAngle: 359.9999
        },

        startAngle: function () {
            return fixAngle(this.options.startAngle)
        },

        stopAngle: function () {
            return fixAngle(this.options.stopAngle)
        },

        isSemicircle: function () {
            return (
                !(this.options.startAngle === 0 && this.options.stopAngle > 359) &&
                !(this.options.startAngle === this.options.stopAngle)
            )
        }
    }

    // implement your plugin
    L.CircleArc = L.Circle.extend(circleArc)

    L.circleArc = function (latlng, options) {
        return new L.CircleArc(latlng, options)
    }

    let _updateCircleSVG = L.SVG.prototype._updateCircle

    L.SVG.include({
        _updateCircle: function (layer) {
            // If we want a circle, we use the original function
            if (!(layer instanceof L.CircleArc) || !layer.isSemicircle()) {
                return _updateCircleSVG.call(this, layer)
            }
            if (layer._empty()) {
                return this._setPath(layer, 'M0 0')
            }

            let p = layer._map.latLngToLayerPoint(layer._latlng)
            let r = layer._radius
            let start = p.rotated(layer.startAngle(), r)
            let end = p.rotated(layer.stopAngle(), r)
            let largeArc = (layer.options.stopAngle - layer.options.startAngle >= 180) ? '1' : '0'
            let d = 'M' + start.x + ',' + start.y +
                'A ' + r + ',' + r + ',0,' + largeArc + ',1,' + end.x + ',' + end.y

            this._setPath(layer, d)
        }
    })

    // return your plugin when you are done
    return L.CircleArc
}, window))