/**
 * @module DAAPlaybackPlayer
 * @version 2018.12.01
 * @description <div style="display:flex;"><div style="width:50%;">
 *              <b>Playback Player.</b>
 *              <p>This tool provides functions for the execution of scenario-based simulation runs. 
 *              Scenarios include information necessary to feed the functional logic
 *              of the prototype, e.g., position and velocity of ownship and traffic.
 *              This information can be based on pre-recorded real flight data, 
 *              or can be manually crafted to capture specific situations. 
 *              A front-end is provided to support interactive simulations, 
 *              with the usual controls start/pause/resume simulation. 
 *              Logging functions are provided to enable off-line analysis of simulation 
 *              traces.</p></div>
 *              <img src="images/daa-playback-player.png" style="margin-left:8%; margin-top:3%; max-height:180px;" alt="DAA Playback Player"></div>
 * @example
// file index.js (to be stored in pvsio-web/examples/demos/daa-displays/)
require.config({
    paths: { 
        widgets: "../../client/app/widgets",
        text: "../../client/app/widgets/daa-displays/lib/text/text"
    }
});
require(["widgets/daa-displays/daa-playback"], function (PlaybackPlayer) {
    "use strict";
    const player = new DAAPlaybackPlayer("player");
    // create simulation controls
    player.simulationControls({
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

    const DAAWebSocket = require("widgets/daa-displays/utils/ws");
    const DAA_Spectrogram = require("widgets/daa-displays/daa-spectrogram");
    require("widgets/daa-displays/daa-utils");

    // utility function, for writing log files to disk. Log files can be strings or JSON objects
    function writeFile (fileWriter, filename, content) {
        if (typeof content === "string") {
            return fileWriter.writeFile(filename, content, { overWrite: true });
        }
        // else it's an array of JSON strings
        return fileWriter.writeFile(filename, content.join("\n"), { overWrite: true });
    }

    // utility function, renders the DOM elements necessary to control a simulation (start, stop, goto, etc.)
    function renderSimulationControls(_this, opt) {
        opt = opt || {};
        let theHTML = Handlebars.compile(_this._simulationControls.htmlTemplate)({
            id: _this.id,
            data: {
                scenarios: _this._scenarioIDs,
                selectedScenario: _this._selectedScenario
            },
            width: opt.width
        });
        $(_this._simulationControls.selector).html(theHTML);
        $("#" + _this.id + "-tot-sim-steps").html(_this._simulationLength);
    }

    class DAAPlaybackPlayer {
        /**
         * @function <a name="DAAPlayback">DAAPlayback</a>
         * @description Constructor. Creates a new playback player.
         * @param id {String} Unique player identifier (default: "daa-playback").
         * @param opt {Object} Player options
         *          <li>label (String): human-readable label, useful for identifying the player (default: label = player id)</li>
         *          <li>fs (Object): FileSystem, used for saving simulation logs.</li>
         *          <li>scenarios (Object({ scenarioID: data })): scenarios to be simulated</li>
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        constructor (id, opt) {
            opt = opt || {};
            this.id = id || "daa-playback";
            this.ws = new DAAWebSocket(); // this should only be used for serving files
            this.fs = opt.fs;
            // this.inputFileReader = null;
            this.outputFileWriter = null;
            // this.scenario = null;
            this.simulationStep = 0; // current simulation step
            this.render = function () { console.error("Warning, rendering function has not been defined :/"); };
            this.step = function () { console.error("Warning, step function has not been defined :/"); };
            this.timer = null;
            this.ms = 1000;
            this.precision = 16; // fractional precision
            this.display = opt.display;

            this._scenarios = opt.scenarios || {};
            this._scenarioIDs = Object.keys(this._scenarios);
            this._selectedScenario = (this._scenarioIDs.length > 0) ? this._scenarioIDs[0] : null;
            this._simulationLength = (this._scenarioIDs.length > 0) ? this._scenarios[this._selectedScenario].length : 0;

            this._repl = {}; // this is a set of websockets for communication with pvsio instances, one instance for each file
            this._log = [];
            this._plot = {};
            this._label = opt.label || this.id;

            let _this = this;
            this._handlers = {
                goto: function () {
                    _this.clearInterval();
                    _this.simulationStep = parseInt($("#" + _this.id + "-goto-input").val());
                    $("#" + _this.id + "-curr-sim-step").html(_this.simulationStep);
                    _this.goto(_this.simulationStep);    
                },
                step: function () {
                    _this.clearInterval();
                    let current_step = parseInt($("#" + _this.id + "-curr-sim-step").html());
                    current_step += (current_step < _this._simulationLength) ? 1 : 0;
                    _this.simulationStep = current_step;
                    $("#" + _this.id + "-curr-sim-step").html(_this.simulationStep);
                    _this.goto(_this.simulationStep);    
                },
                speed: function () {
                    let speed = parseFloat($("#" + _this.id + "-speed-input").val());
                    if (!isNaN(speed) && speed > 0) {
                        _this.ms = 1000 * (100 / speed);
                    }
                },
                identify: function () {
                    $(".daa-view-splash").css("display", "block").css("opacity", 0.5);
                    setTimeout(function () {
                        $(".daa-view-splash").css("display", "none");
                    }, 1600);
                },
                installScenarioSelectors: function () {
                    _this._scenarioIDs.forEach(function (scenario) {
                        $("#" + _this.id + "-scenario-" + scenario).on("click", function () {
                            if (_this._selectedScenario !== scenario) {
                                _this._selectedScenario = scenario;
                                _this._simulationLength = _this._scenarios[_this._selectedScenario].length;
                                _this._log = [];
                                console.log("Scenario " + scenario + " selected"); 
                                $("#" + _this.id + "-selected-scenario").html(scenario);
                                _this.refreshSimulationPlots();
                                _this.goto(0);
                            }
                        });
                    });
                }
            };
            this._defines = {
                step: async function (val, opt) {
                    opt = opt || {};
                    if (_this.simulationStep < _this._simulationLength) {
                        try {
                            await val(_this);
                        } catch (stepError) {
                            console.error("Step function has thrown a runtime exception: ", stepError);
                        }
                        $("#" + _this.id + "-curr-sim-step").html(_this.simulationStep);
                        if (!opt.preventIncrement) {
                            _this.simulationStep++;
                        }
                    } else {
                        console.log("Simulation complete!");
                        _this.clearInterval();
                    }
                },
                writeLog: async function () {
                    if (_this.logFile && _this._log.length > 0 && _this.fs) {
                        console.log("Writing log file " + _this.logFile);
                        await writeFile(_this.fs, _this.logFile, _this._log, { overWrite: true });
                        console.log(_this._log.length + " event saved in log file " + _this.logFile);
                    }
                }
            };
        }
        /**
         * @function <a name="getCurrentSimulationStep">getCurrentSimulationStep</a>
         * @descrition Returns the current simulation step
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        getCurrentSimulationStep () {
            return this.simulationStep;
        }
        /**
         * @function <a name="selectScenario">selectScenario</a>
         * @description Loads the scenario to be simulated. The available scenarios are those provided in the constructor, using parameter scenarios.
         * @param scenario {String} Scenario identifier.
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        selectScenario (scenario) {
            if (this._scenarios[scenario]) {
                this._selectedScenario = scenario;
                this._simulationLength = this._scenarios[scenario].length;
                $("#" + this.id + "-tot-sim-steps").html(this._simulationLength);
            } else {
                console.error("Unable to select scenario " + scenario + " :/");
            }
            return this;
        }
        /**
         * @function <a name="define">define</a>
         * @description Utility function for defining player functionalities that are simulation-specific.
         *              <li>"step": defines the function executed at each simulation step</li>
         *              <li>"render": defines the render function necessary for rending the prototype associated with the simulation</li>
         * @param fname {String} Function name
         * @param fbody {String} Function body
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        define (fname, fbody) {
            if (fname === "step") {
                let _this = this;
                this.step = async function (opt) {
                    await _this._defines.step(fbody, opt);
                    await _this._defines.writeLog();
                };
            } else {
                this[fname] = fbody;
            }
            return this;
        }
        /**
         * @function <a name="goto">goto</a>
         * @description Goes to a given target simulation step
         * @param step {nat} Target simulation step.
         * @return {nat} The current simulation step, which corresponds to the target step (value clipped if target is outside the simulation range). 
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        async goto(step) {
            this.clearInterval();
            step = (step > 0) ?
                        (step < this._simulationLength) ? step : (this._simulationLength - 1)
                        : 0;
            this.simulationStep = step;
            if (step === 0 && this.init) {
                await this.init();
            }
            this.step({ preventIncrement: true });
            return this.step;
        }
        /**
         * @function <a name="log">log</a>
         * @description Logs the provided state information.
         * @param st {String} State information to be logged.
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        log (st) {
            this._log.push(st);
            return this;
        }
        /**
         * @function <a name="getLog">getLog</a>
         * @description Returns the log data.
         * @return {Array(String)} State information logged by the player.
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        getLog () {
            return this._log;
        }
        /**
         * @function <a name="connectToServer">connectToServer</a>
         * @description Connects to a WebSocket server compatible with the PVSio-web APIs.
         * @param opt {Object} Connection options
         *          <li>url (String): server URL (default: localhost)</li>
         *          <li>port (String): server port (default: 8082)</li>
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        async connectToServer (opt) {
            opt = opt || {};
            this.url = opt.url || "localhost";
            this.port = opt.port || 8082;
            await this.ws.connectToServer(this.url, this.port);
            // enable file system
            if (opt.fs) {
                await this.enableFileSystem();    
                console.log("playback can read/write files");
            }
            return this;
        }
        /**
         * @function <a name="pvsio">pvsio</a>
         * @description Sends a pvsio evaluation request to the server
         * @param pvsFile {String} PVS file to be loaded in pvsio
         * @param data {Object({ expr: String, basePath: String})} Descriptor for the evaluation request
         *              <li>expr (String): PVS expression to be evaluated</li>
         *              <li>basePath (String): path of the PVS file. The root is the examples folder of pvsio-web.</li> 
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        async pvsio (pvsFile, data) {
            console.log("Evaluation request for pvsio", pvsFile, data);
            if (!this._repl[pvsFile]) {
                let ws = new DAAWebSocket();
                await ws.connectToServer();
                await ws.send({
                    type: "startProcess", // TODO: in the server, change this to "pvsio"
                    data: {
                        name: pvsFile,
                        demoName: data.basePath
                    }
                });
                this._repl[pvsFile] = ws;
            }
            let res = await this._repl[pvsFile].send({
                type: "sendCommand",
                data: { command: data.expr + ";" }
            });
            return {
                err: res.err,
                pvsio: (res.data && res.data.length > 0) ? res.data[0] : null,
                json: res.json
            };
        }
        /**
         * @function <a name="java">java</a>
         * @description Sends a java evaluation request to the server
         * @param javaFile {String} Java file to be executed
         * @param data {Object({ expr: String, basePath: String})} Descriptor for the evaluation request
         *              <li>argv (Array(String)): arguments to be passed to the Java file</li>
         *              <li>javaOptions (Array(String)): options for the java environment (e.g., -jar).</li>
         *              <li>basePath (String): path of the PVS file. The root is the examples folder of pvsio-web.</li> 
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        async java (javaFile, data) {
            console.log("Evaluation request for java", javaFile, data);
            if (!this._repl[javaFile]) {
                let ws = new DAAWebSocket();
                await ws.connectToServer();
                this._repl[javaFile] = ws;
            }
            let res = await this._repl[javaFile].send({
                type: "java",
                data: {
                    javaFile: javaFile,
                    argv: data.argv,
                    javaOptions: data.javaOptions,
                    basePath: data.basePath
                }
            });
            return {
                err: res.err,
                javaout: res.stdout
            };
        }
        /**
         * @function <a name="run">run</a>
         * @description Starts the simulation run
         * @param opt {Object} Simulation options
         *              <li>paused (bool): Whether only the current simulation step should be executed (paused = true), or all simulation steps one after the other (paused = false). (default: paused = false)</li>
         *              <li>ms (real): simulation speed, in terms of temporal duration of a simulation step.</li>
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        run (opt) {
            opt = opt || {};
            this.ms = opt.ms || this.ms || 1000;
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
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        simulationPlot(id, desc) {
            let plotDescriptor = Object.assign({}, desc);
            plotDescriptor.id = id || "plot";
            if (plotDescriptor.type === "spectrogram") {
                this._plot[plotDescriptor.id] = new DAA_Spectrogram(this.id + "-" + plotDescriptor.id.replace(/\s/g, ""), {
                    top: plotDescriptor.top, left: plotDescriptor.left, height: plotDescriptor.height, width: plotDescriptor.width
                }, { 
                    units: plotDescriptor.units,
                    length: this._simulationLength,
                    label: plotDescriptor.label,
                    range: plotDescriptor.range,
                    parent: plotDescriptor.parent
                });
            }
            return this;
        }
        /**
         * @function <a name="refreshSimulationPlots">refreshSimulationPlots</a>
         * @description Updates the visual appearance of the simulation plot (e.g., to match a new simulation length)
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        refreshSimulationPlots() {
            let _this = this;
            let plots = Object.keys(_this._plot);
            plots.forEach(function (plotID) {
                _this._plot[plotID].setLength(_this._simulationLength);
            });
            $("#" + _this.id + "-tot-sim-steps").html(_this._simulationLength);
            return this;
        }
        /**
         * @function <a name="getPlot">getPlot</a>
         * @description Returns a given plot
         * @param plotID {String} The identifier of the plot to be returned.
         * @return {Object} A plot object. The object type depends on the plot type.
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        getPlot(plotID) {
            return this._plot[plotID];
        }
        // /**
        //  * @function <a name="setScenario">setScenario</a>
        //  * @description Selects a scenario
        //  * @memberof module:DAAPlaybackPlayer
        //  * @instance
        //  */
        // setScenario (scenario) {
        //     this.scenario = scenario;
        // }
        /**
         * @function <a name="getCurrentFlightData">getCurrentFlightData</a>
         * @description Returns the flight data of the current simulation step.
         * @return {Object} Flight data, including position and velocity of ownship and traffic.
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        getCurrentFlightData (enc) {
            enc = enc || "lla";
            let data = this._scenarios[this._selectedScenario][enc][this.simulationStep];
            return (enc === "lla") ? JSON.parse(data) : data;
        }
        /**
         * @function <a name="getParams">getParams</a>
         * @description Returns the configuration parameters (if any) used for the simulation.
         * @return {Object} Flight data.
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        getParams (conf) {
            // conf can be std, nomA, nomB
            conf = conf || "std";
            console.log("loading configuration " + conf);
            let params = [];
            let _this = this;
            this._scenarios[this._selectedScenario].params[conf].split(",").forEach(function (assignment) {
                let data = assignment.split(":=");
                if (data.length > 1 && !isNaN(+data[1])) {   
                    let ans = [ data[0] ];
                    // ans.push((+data[1]).toFixed(_this.precision)); --- the builtin function toFixed(...) provides inaccurate answers!?
                    let val = Math.floor((+data[1]) * Math.pow(10, _this.precision)) / Math.pow(10, _this.precision);
                    ans.push(val.toString());
                    params.push(ans.join(":= "));
                } else {
                    params.push(assignment);
                }
            });
            return params.join(",");
        }
        /**
         * @function <a name="getSelectedScenario">getSelectedScenario</a>
         * @description Returns the name of the scenario currently selected in the player.
         * @return {Object} Flight data.
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        getSelectedScenario () {
            return this._selectedScenario;
        }
        /**
         * @function <a name="setInterval">setInterval</a>
         * @description Schedules the periodic execution of a function.
         *              This can be used, e.g., to schedule the execution of simulation steps.
         *              This function differs from the standard windows.setInterval in that it can handle situations 
         *              where the time to execute a simulation step might be larger than the time set for the 
         *              simulation interval (e.g,. because the computer running the simulation is not fast enough
         *              to keep up with the simulation inteval). In those situations, the simulation interval is 
         *              extended to match the time necessary to complete a simulation step.
         * @param fun {Function} The step function to be executed.
         * @param ms {real} The duration of the simulation interval, in milliseconds.
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        async setInterval(fun, ms) {
            if (!this._timer_active) {
                fun = (typeof fun === "function") ? fun : function () {
                    console.error("Warning, step function is malformed :/");
                };
                this.ms = ms || this.ms || 1000;
                this._timer_active = true;
                let _this = this;
                while(this._timer_active) {
                    let promises = [
                        new Promise(function (resolve) { setTimeout(resolve, _this.ms); }),
                        fun()
                    ];
                    await Promise.all(promises);
                }
            }
            return this;
        }
        /**
         * @function <a name="clearInterval">clearInterval</a>
         * @description Stops the periodic execution of simulation steps.
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        clearInterval() {
            this._timer_active = false;
            return this;
        }
        /**
         * @function <a name="simulationControls">simulationControls</a>
         * @description Utility function for attaching the simulation controls to the DOM.
         * @param opt {Object} Configuration options for simulation controls (play, pause, step, goto, identify simulation, simulatioin speed)
         *          <li>parent (String): the identifier of the DOM element where the controls should be attached</li>
         *          <li>top (real): top margin of the simulation controls</li>
         *          <li>left (real): left margin of the simulation controls</li>
         *          <li>width (real): the width of the bar displaying the simulation controls</li>
         * @memberof module:DAAPlaybackPlayer
         * @instance
         */
        simulationControls(opt) {
            opt = opt || {};
            opt.parent = opt.parent || (this.id + "-simulation-controls");
            opt.top = opt.top || 0;
            opt.left = opt.left || 0;
            opt.width = (isNaN(+opt.width)) ? 1900 : +opt.width; 
            if (document.getElementById(opt.parent) === null) {
                createDiv(opt.parent, opt);
            }
            this._simulationControls = {
                htmlTemplate: opt.htmlTemplate || require("text!widgets/daa-displays/templates/daa-playback.handlebars"),
                selector: "#" + opt.parent
            }; 
            renderSimulationControls(this, opt);

            // install handlers for simulation controls play/pause/restart/goto/...
            let _this = this;
            $("#" + this.id + "-play").on("click", function () { _this.run(); });
            $("#" + this.id + "-pause").on("click", function () { _this.clearInterval(); });
            $("#" + this.id + "-step").on("click", function () { _this._handlers.step(); });
            $("#" + this.id + "-goto").on("click", function () { _this._handlers.goto(); });
            $("#" + this.id + "-goto-input").on("change", function () { _this._handlers.goto(); });
            $("#" + this.id + "-identify").on("click", function () { _this._handlers.identify(); });
            $("#" + this.id + "-speed-input").on("input", function () { _this._handlers.speed(); });
            this._handlers.installScenarioSelectors();
            return this;
        }
    }

    module.exports = DAAPlaybackPlayer;
});