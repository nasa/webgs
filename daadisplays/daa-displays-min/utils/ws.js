/**
 * Basic websocket client for interacting with the pvsio-web server
 * @author Paolo Masci
 * @date Dec 2018
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, esnext:true */
/*global define, WebSocket, Promise */
define(function (require, exports, module) {
    "use strict";

    class DAAWebSocket {
        constructor () {
            this.ws = null;
        }
        connectToServer (url, port) {
            this.url = url || "localhost";
            this.port = port || 8082;
            if (this.ws) { return Promise.resolve(this.ws); }
            let _this = this;
            return new Promise(function (resolve, reject) {
                let wsUrl = "ws://" + _this.url + ":" + _this.port;
                _this.ws = new WebSocket(wsUrl);
                _this.ws.onopen = function (evt) {
                    resolve(_this.ws);
                };
                _this.ws.onerror = function (evt) {
                    console.error("websocket closed unexpectedly :/", evt);
                    reject(evt);
                };
                _this.ws.onclose = function (evt) {
                    console.error("websocket closed gracefully", evt);
                    this.ws = null;
                    resolve(evt);
                };
                _this.ws.onmessage = function (evt) {
                    console.error("Warning, message received on websocket but client has not performed any send", evt);
                };
            });
        }
        send (token) {
            if (this.ws) {
                let _this = this;
                return new Promise(function (resolve, reject) {
                    _this.ws.onmessage = function (evt) {
                        let token = JSON.parse(evt.data);
                        if (token && token.time && token.time.client) {
                            let time = new Date().getTime() - token.time.client.sent;
                            console.log("Time to response", time, "ms");
                            if (token.type.indexOf("_error") >= 0) {
                                console.error(token); // errors should always be reported in the browser console
                            }
                            resolve(token);
                        } else {
                            console.warn("token does not include timestamp from client?", token);
                        }
                    };
                    if (token && token.type) {
                        let id = new Date().toISOString(); // TODO: replace with RFC4122 uuid
                        token.id = token.id || id;
                        token.time = { client: { sent: new Date().getTime() } };
                        if (token.data && token.data.command && typeof token.data.command === "string") {
                            // removing white space is useful to reduce the message size (e.g., to prevent stdin buffer overflow)
                            token.data.command = token.data.command.split(",").map(function(str) { return str.trim(); }).join(",");
                        }
                        _this.ws.send(JSON.stringify(token));
                    } else {
                        console.error("Token type is undefined", token);
                    }    
                });
            }
            console.error("Cannot send, WebSocket closed :/");
            return Promise.reject();
        }
    }

    module.exports = DAAWebSocket;
});
