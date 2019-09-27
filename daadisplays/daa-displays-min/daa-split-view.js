/**
 * @module DAASplitView
 * @version 2018.12.01
 * @description <div style="display:flex;"><div style="width:50%;">
 *              <b>Split-View Player.</b>
 *              <p>This player extends the DAA Playback Player with functions 
 *              for comparative analysis of interactive simulations. Two simulation are executed 
 *              in lock-step and visualized side-to-side. Utility functions are provided to compute 
 *              the difference between simulation traces and visualize differences using graphs or 
 *              textual output. Comparison operators can be customized, e.g., floating point numbers 
 *              can be compared up-to a given number of decimal digits.</p></div>
 *              <img src="images/daa-split-view.png" style="margin-left:8%; max-height:180px;" alt="DAA Split View Player"></div>
 * @example
// file index.js (to be stored in pvsio-web/examples/demos/daa-displays/)
require.config({
    paths: { 
        widgets: "../../client/app/widgets",
        text: "../../client/app/widgets/daa-displays/lib/text/text"
    }
});
require(["widgets/daa-displays/daa-split-view"], function (DAASplitView) {
    "use strict";
    const splitView = new DAASplitView("split-view");
    // create simulation controls
    splitView.simulationControls({
        top: 860
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
define(function (require, exports, module) {
    "use strict";

    const DAAPlayback = require("widgets/daa-displays/daa-playback");
    
    class DAASplitView extends DAAPlayback {
        /**
         * @function <a name="DAASplitView">DAASplitView</a>
         * @description Constructor. Creates a new split view player.
         * @param id {String} Unique player identifier (default: "daa-split-view").
         * @param opt {Object} Player options
         *          <li>left (Object({label: string, display: Object}): configuration options for left display</li>
         *          <li>right (Object({label: string, display: Object}): configuration options for right display</li>
         *          <li>fs (Object): FileSystem, used for saving simulation logs.</li>
         *          <li>scenarios (Object({ scenarioID: data })): scenarios to be simulated</li>
         * @memberof module:DAASplitView
         * @instance
         */
        constructor (id, opt) {
            opt = opt || {};
            id = id || "daa-split-view";
            super(id, opt);
            this._label = {
                left: (opt.left && opt.left.label) ? opt.left.label : "left",
                right: (opt.right && opt.right.label) ? opt.right.label : "right"
            };
            let options = {
                left: Object.assign({ fs: opt.fs }, opt.left),
                right: Object.assign({ fs: opt.fs }, opt.right)
            };
            options.right.scenarios = options.left.scenarios = this._scenarios;
            this.players = {
                left: new DAAPlayback(this.id + "-" + this._label.left, options.left),
                right: new DAAPlayback(this.id + "-" + this._label.right, options.right)
            };
            // create aliases using the provided labels
            this.players[this._label.left] = this.players.left;
            this.players[this._label.right] = this.players.right;
            this.fractionalAccuracy = (isNaN(parseInt(opt.fractionalAccuracy))) ? 3 : parseInt(opt.fractionalAccuracy);
            let _this = this;
            this._handlers.installScenarioSelectors = function () {
                _this._scenarioIDs.forEach(function (scenario) {
                    $("#" + _this.id + "-scenario-" + scenario).on("click", function () {
                        if (_this._selectedScenario !== scenario) {
                            _this.selectScenario(scenario);
                            console.log("Scenario " + scenario + " selected"); 
                            $("#" + _this.id + "-selected-scenario").html(scenario);
                            _this.players.left.refreshSimulationPlots();
                            _this.players.left._log = [];
                            _this.players.right.refreshSimulationPlots();
                            _this.players.right._log = [];
                            _this.goto(0);
                        }
                    });
                });
            };
        }
        /**
         * @function <a name="selectScenario">selectScenario</a>
         * @description Loads the scenario to be simulated. The available scenarios are those provided in the constructor, using parameter scenarios. 
         * @param scenario {String} Scenario identifier.
         * @memberof module:DAASplitView
         * @instance
         */
        selectScenario (scenario) {
            super.selectScenario(scenario);
            this.players.left.selectScenario(scenario);
            this.players.right.selectScenario(scenario);
            return this;
        }
        /**
         * @function <a name="getPlayer">getPlayer</a>
         * @description Accessor function, returns one of the players. 
         * @param playerID {String} Player identifier.
         * @memberof module:DAASplitView
         * @instance
         */
        getPlayer (playerID) {
            return this.players[playerID];
        }
        /**
         * @function <a name="simulationControls">simulationControls</a>
         * @description Utility function for attaching the simulation controls to the DOM.
         * @param opt {Object} Configuration options for simulation controls (play, pause, step, goto, identify simulation, simulatioin speed)
         *          <li>parent (String): the identifier of the DOM element where the controls should be attached</li>
         *          <li>top (real): top margin of the simulation controls</li>
         *          <li>left (real): left margin of the simulation controls</li>
         *          <li>width (real): the width of the bar displaying the simulation controls</li>
         * @memberof module:DAASplitView
         * @instance
         */
        simulationControls(opt) {
            opt = opt || {};
            opt.htmlTemplate = require("text!widgets/daa-displays/templates/daa-split-view.handlebars");
            return super.simulationControls(opt);
        }
        /**
         * @function <a name="connectToServer">connectToServer</a>
         * @description Connects to a WebSocket server compatible with the PVSio-web APIs.
         * @param opt {Object} Connection options
         *          <li>url (String): server URL (default: localhost)</li>
         *          <li>port (String): server port (default: 8082)</li>
         * @memberof module:DAASplitView
         * @instance
         */
        async connectToServer (url, port) {
            url = url || "localhost";
            port = port || 8082;
            await this.players.left.connectToServer(url, port);
            await this.players.right.connectToServer(url, port);
            await super.connectToServer(url, port);
            return this;
        }
        /**
         * @function <a name="run">run</a>
         * @description Starts the simulation run
         * @param opt {Object} Simulation options
         *              <li>paused (bool): Whether only the current simulation step should be executed (paused = true), or all simulation steps one after the other (paused = false). (default: paused = false)</li>
         *              <li>ms (real): simulation speed, in terms of temporal duration of a simulation step.</li>
         * @memberof module:DAASplitView
         * @instance
         */
        async run(opt) {
            opt = opt || {};
            this.ms = opt.ms || this.ms || 1000;
            this.players.right._simulationLength = this.players.left._simulationLength = this._simulationLength;
            return (opt.paused) ? this.step({ preventIncrement: true }) // this step is done to initialise the simulation
                        : this.setInterval(this.step, this.ms);
        }
        /**
         * @function <a name="simulationPlot">simulationPlot</a>
         * @description Creates a simulation plot
         * @param id {String} Unique plot identifier
         * @param desc {Object} Simulation options
         *              <li>paused (bool): Whether only the current simulation step should be executed (paused = true), or all simulation steps one after the other (paused = false). (default: paused = false)</li>
         *              <li>ms (real): simulation speed, in terms of temporal duration of a simulation step.</li>
         *              <li>type (String): type of plot. Currently, "spectrogram" is the only type of plot supported.</li>
         *              <li>units (Object({ from: String, to: String })): information about plot units: "from" identifies the units of the data; "to" identifies the units of the plot. 
         *                  Valid units are (grouped by conversion classes): "rad"/"deg"; "msec"/"knots"; "meters"/"feet"; "mpm"/"fpm 100x" </li>
         *              <li>label (String): plot label</li>
         *              <li>range (Object({ from: real, to: real })): plot range</li>
         *              <li>parent (String): parent element in the DOM where the plot should be attached</li>
         * @memberof module:DAASplitView
         * @instance
         */
        simulationPlot (id, desc) {
            let ds = Object.assign({}, desc);
            ds.top = ds.top || 0;
            ds.left = ds.left || 0;
            ds.width = ds.width || 2100;
            ds.height = ds.height || 80;
            ds.label = (typeof ds.label === "object") ? Object.assign(ds.label) : {};
            ds.label.top = ds.label.top || id;
            ds.label.left = this._label.left;
            this.players.left.simulationPlot(id, ds);
            ds.top += (ds.height + 55);
            ds.label.top = null;
            ds.label.left = this._label.right;
            this.players.right.simulationPlot(id, ds);

            let _this = this;
            this._defines.writeLog = async function () {
                _this.players.left._defines.writeLog();
                _this.players.right._defines.writeLog();
            };
            return this;
        }
        /**
         * @function <a name="getPlot">getPlot</a>
         * @description Returns a given plot
         * @param plotID {String} The identifier of the plot to be returned.
         * @param playerID {String} The identifier of the player that produced the plot.
         * @return {Object} A plot object. The object type depends on the plot type.
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        getPlot (plotID, playerID) {
            return (playerID === "right" || playerID === this._label.right) ? this.players.right.getPlot(plotID)
                        : this.players.left.getPlot(plotID);
        }
    

        

        
        // readInputFile (filename) {
        //     return this.inputFileReader.readFile(filename);
        // }
        // writeFile (filename, json) {
        //     if (typeof json === "string") {
        //         return this.outputFileWriter.writeFile(filename, json, { overWrite: true });
        //     }
        //     // else we assume it's a JSON object
        //     let output = json.map(function (elem) {
        //         return JSON.stringify(elem);
        //     });
        //     let str = output.join("\n");
        //     return this.outputFileWriter.writeFile(filename, str, { overWrite: true });
        // }
        // diff(jsonString1, jsonString2, opt) {
        //     let accuracy = this.fractionalAccuracy;
        //     function normaliseString(str) {
        //         if (!isNaN(parseFloat(str))) { return parseFloat(str).toFixed(accuracy); }
        //         if (!str) { return ""; }
        //         return str;
        //     }
        //     function getState(jsonString) {
        //         let jsonArray = JSON.parse(jsonString);
        //         return jsonArray.map(function (elem) {
        //             return elem.state;
        //         });
        //     }
        //     function stringDiff(str1, str2, opt) {
        //         opt = opt || {};
        //         let labels = opt.labels || [ "val-1", "val-2" ];
        //         let text1 = normaliseString(str1);
        //         let text2 = normaliseString(str2);
        //         if (text1 !== text2) {
        //             let ans = {};
        //             ans[labels[0]] = text1;
        //             ans[labels[1]] = text2;
        //             return ans;
        //         }
        //         return null;
        //     }
        //     function jsonDiff(json1, json2, opt) {
        //         opt = opt || {};
        //         let labels = opt.labels || [ "json-1", "json-2" ];
        //         if (typeof json1 === "string" || typeof json1 === "number") {
        //             let ans = stringDiff(json1, json2, opt);
        //             return ans; // this branch returns null when the two strings are identical 
        //         } else if (typeof json1 === "object") {
        //             let keys = Object.keys(json1);
        //             let ans = {};
        //             for (let i in keys) {
        //                 let k = keys[i];
        //                 if (json2 && typeof json2 === "object") {
        //                     if (json1.length) {
        //                         let tmp = [];
        //                         for (let i = 0; i < json1.length; i++) {
        //                             let ans = jsonDiff(json1[i], json2[i], opt);
        //                             if (ans && Object.keys(ans).length > 0) {
        //                                 tmp.push(ans);
        //                             }
        //                         }
        //                         return tmp;
        //                     } else {
        //                         let tmp = jsonDiff(json1[k], json2[k], opt);
        //                         if (tmp && Object.keys(tmp).length > 0) {
        //                             ans[k] = tmp;
        //                         }
        //                     }
        //                 } else {
        //                     // the fiels is missing in json2
        //                     ans[k] = {};
        //                     ans[k][labels[0]] = json1[k];
        //                     ans[k][labels[1]] = "";
        //                 }   
        //             }
        //             return ans;
        //         }
        //         console.error("unable to compute diff for elements ", json1, json2);
        //     }
        //     function diffAttributes(json1, json2, opt) {
        //         let keys = Object.keys(json1);
        //         let ans = {};
        //         for (let i = 0; i < keys.length; i++) {
        //             let d = jsonDiff(json1[keys[i]], json2[keys[i]], opt);
        //             if (opt.verbose || Object.keys(d).length > 0) {
        //                 ans[keys[i]] = d;
        //             }
        //         }
        //         return ans;
        //     }
        //     function diffLines(str1, str2, opt) {
        //         let json1 = getState(str1);
        //         let json2 = getState(str2);

        //         if (json1.length !== json2.length) {
        //             console.error("Warning, comparing two arrays of differnet length");
        //         }
        //         let ans = [];
        //         for (let i = 0; i < json1.length && i < json2.length; i++) {
        //             let d = jsonDiff(json1[i], json2[i], opt);
        //             // let d = diffAttributes(json1[i], json2[i], opt);
                    
        //             if (opt.verbose || Object.keys(d).length > 0) {
        //                 ans.push({
        //                     line: i,
        //                     diff: d
        //                 });
        //             }
        //         }
        //         return ans;
        //     }

        //     let ans = diffLines(jsonString1, jsonString2, opt);
        //     console.log(ans);
        //     return ans;
        // }
        // toJSON(jsonString) {
        //     let jsonArray = JSON.parse(jsonString);
        //     let i = 0;
        //     return jsonArray.map(function (elem) {
        //         return {
        //             line: i++,
        //             state: elem.state
        //         }
        //     });
        // }
        // debugView(id, attributes) {
        //     attributes = attributes || [];
        //     const width = $("#" + id).css("width");
        //     const theHTML = Handlebars.compile(splitViewToolsTemplate)({
        //         attributes: attributes.map(function (attribute) {
        //             return {
        //                 id: attribute.name.replace(/\s/g, ""), // remove whitespaces
        //                 label: attribute.name,
        //                 type: attribute.type,
        //                 units: attribute.units
        //             }
        //         }),
        //         width: width,
        //         id: this.id
        //     });
        //     $("#" + id).html(theHTML);

        //     return this;
        // }
        // simulationControls(handlers) {
        //     let _this = this;
        //     function install_handler(fun, name) {
        //         $("#" + _this.id + "-" + name).on("click", function () {
        //             fun();
        //         });    
        //     }
        //     handlers = handlers || {};
        //     _.each(handlers, function (fun, name) {
        //         install_handler(fun, name);
        //     });
        // }
    }

    module.exports = DAASplitView;
});