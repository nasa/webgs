/**
 * @module fs
 * @desc File system utils
 * @author Paolo Masci
 * @date Nov 08, 2018
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, esnext: true */
/*global define, Promise */
define(function (require, exports, module) {
    "use strict";

    const DAAWebSocket = require("widgets/daa-displays/utils/ws");

    function getName(path) {
        return path.split("/").slice(-1).join("");
    }

    class FileSystem {
        constructor(url, port) {
            this.ws = new DAAWebSocket();
        }
        async connectToServer(url, port) {
            await this.ws.connectToServer(url, port);
            return this;
        }
        writeFile (path, content, opt) {
            if (this.ws) {
                opt = opt || {};
                opt.encoding = opt.encoding || "utf8";
                if (content && typeof content === "object") {
                    content = JSON.stringify(content, null, " ");
                }
                const token = {
                    type: "writeFile",
                    path: path,
                    name: getName(path),
                    content: content || "",
                    encoding: opt.encoding,
                    opt: opt
                };
                return this.ws.send(token);
            }
            console.error("Cannot write file, WebSocket closed :/");
            return Promise.reject();
        }
        readFile (path, opt) {
            if (this.ws) {
                opt = opt || {};
                opt.encoding = opt.encoding || "utf8";
                const token = {
                    type: "readFile",
                    path: path,
                    name: getName(path),
                    encoding: opt.encoding,
                    opt: opt
                };
                return this.ws.send(token);
            }
            console.error("Cannot read file, WebSocket is closed :/");
            return Promise.reject();
        }
        async readScenarioFiles (scenarios, opt) {
            opt = opt || {};
            opt.basePath = opt.basePath || "";
            let ans = {};
            for (let i = 0; i < scenarios.length; i++) {
                let daa = await this.readFile(opt.basePath + scenarios[i] + ".daa");
                daa = daa.content.split("\n").filter(function (line) { return line !== ""; });
                console.log(".daa scenario opened correctly");
                let lla = await this.readFile(opt.basePath + scenarios[i] + ".lla.json");
                lla = lla.content.split("\n").filter(function (line) { return line !== ""; });
                console.log(".lla scenario opened correctly");
                let xyz = await this.readFile(opt.basePath + scenarios[i] + ".xyz.pvsin");
                xyz = xyz.content.split("\n").filter(function (line) { return line !== ""; });
                console.log(".xyz scenario opened correctly");
                let params_std = await this.readFile(opt.basePath + "params.std.pvsin");
                params_std = params_std.content;
                let params_nomA = await this.readFile(opt.basePath + "params.nomA.pvsin");
                params_nomA = params_nomA.content;
                let params_nomB = await this.readFile(opt.basePath + "params.nomB.pvsin");
                params_nomB = params_nomB.content;
                console.log("daidalus configuration files (std/nomA/nomB) opened correctly");
                let units = await this.readFile(opt.basePath + scenarios[i] + ".units.json");
                units = JSON.parse(units.content);
                console.log("daidalus units file opened correctly");
                ans[scenarios[i]] = {
                    daa: daa,
                    xyz: xyz,
                    lla: lla,
                    params: {
                        std: params_std,
                        nomA: params_nomA,
                        nomB: params_nomB
                    },
                    units: units
                };
                ans[scenarios[i]].length = ans[scenarios[i]].xyz.length;
            }
            return ans;
        }
    }

    module.exports = FileSystem;
});
