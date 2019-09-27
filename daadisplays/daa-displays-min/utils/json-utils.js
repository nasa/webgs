// javascript code based on http://jsfiddle.net/S2hsS/
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, esnext: true */
define(function (require, exports, module) {
    "use strict";

    module.exports = {
        flatten: function (data) {
            const result = {};
            function recurse(cur, prop) {
                if (Object(cur) !== cur) {
                    result[prop] = cur;
                } else if (Array.isArray(cur)) {
                    let l = cur.length;
                    for (let i = 0; i < l; i++) {
                        recurse(cur[i], prop + "[" + i + "]");
                    }
                    if (l === 0) {
                        result[prop] = [];
                    }
                } else {
                    let isEmpty = true;
                    for (let p in cur) {
                        isEmpty = false;
                        recurse(cur[p], prop ? prop + "." + p : p);
                    }
                    if (isEmpty && prop) {
                        result[prop] = {};
                    }
                }
            }
            recurse(data, "");
            return result;
        },
        unflatten: function (data) {
            if (Object(data) !== data || Array.isArray(data)) {
                return data;
            }
            const regex = /\.?([^.\[\]]+)|\[(\d+)\]/g;
            const resultholder = {};
            for (let p in data) {
                let cur = resultholder;
                let prop = "";
                let m = regex.exec(p);
                while (m) {
                    cur = cur[prop] || (cur[prop] = (m[2] ? [] : {}));
                    prop = m[2] || m[1];
                    m = regex.exec(p);
                }
                cur[prop] = data[p];
            }
            return resultholder[""] || resultholder;
        }

    };
});