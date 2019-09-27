/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, esnext: true */
const color = {
    RECOVERY: "#07dc0a", // DASHED green
    FAR: "yellow", // DASHED YELLOW
    MID: "yellow", //"#ffbf00",
    NEAR: "red",
    UNKNOWN: "gray",
    NONE: "transparent"
};
const bandColors = {
    RECOVERY: {
        style: "dash",
        color: "#07dc0a"
    }, // DASH green
    FAR: {
        style: "dash",
        color: "yellow"
    }, // DASH YELLOW
    MID: {
        style: "solid",
        color: "yellow"
    }, // YELLOW
    NEAR: {
        style: "solid",
        color: "red"
    }, // red
    UNKNOWN: {
        style: "solid",
        color: "gray"
    }, // gray
    NONE: {
        style: "solid",
        color: "transparent"
    }
};
const bandColorsALT = {
    RECOVERY: {
        style: "dash",
        color: "#07dc0a"
    }, // DASH green
    FAR: {
        style: "dash",
        color: "yellow"
    }, // DASH YELLOW
    MID: {
        style: "solid",
        color: "yellow"
    }, // YELLOW
    NEAR: {
        style: "solid",
        color: "red"
    }, // red
    UNKNOWN: {
        style: "solid",
        color: "gray"
    }, // gray
    NONE: {
        style: "solid",
        color: "white"
    }
};
const bugColors = {
    RECOVERY: "#07dc0a", // DASHED green
    FAR: "yellow", // DASHED YELLOW
    MID: "yellow", //"#ffbf00",
    NEAR: "red",
    UNKNOWN: "gray",
    NONE: "white"
};
// m/sec to knots
function msec2knots(msec) {
    return msec * 1.94384;
}

function rad2deg(rad) {
    return rad * 180 / Math.PI;
}

function meters2feet(m) {
    return m * 3.28084;
}
// y axis identifies the direction of the aircraft
function v2rad(v3) {
    // the returned angle is in rads
    if (v3.y === 0 && v3.x === 0) {
        return 0; // atan2 is undefined if y and x are both zero
    }
    return Math.atan2(v3.y, v3.x);
}
// y axis identifies the direction of the aircraft
function yaw(v3) {
    // this is the compass
    return rad2deg(Math.atan2(v3.y, v3.x)) - 90; // the rotation on 90 degs is necessary because the aircraft moves over the x axis to go ahead, but in the canvas this corresponds to the x axis
}
// y axis identifies the direction of the aircraft
function pitch(v3) {
    return rad2deg(Math.atan2(v3.z, v3.y));
}
// y axis identifies the direction of the aircraft
function roll(v3) {
    return rad2deg(Math.atan2(v3.z, v3.x));
}

function fixed3(val) {
    return (val < 10) ? "00" + val :
        (val < 100) ? "0" + val : val.toString();
}

function fixed2(val) {
    return (val < 10) ? "0" + val : val.toString();
}

function modulo(v) {
    v = v || {};
    v.x = v.x || 0;
    v.y = v.y || 0;
    v.z = v.z || 0;
    return Math.sqrt((v.x * v.x) + (v.y * v.y) + (v.z * v.z));
}

function limit(min, max, name) {
    return function (val) {
        if (val < min) {
            if (name) {
                console.error("Warning: " + name + " is " + val + ", exceeds range [" + min + "," + max + "]");
            }
            return min;
        } else if (val > max) {
            if (name) {
                console.error("Warning: " + name + " is " + val + ", exceeds range [" + min + "," + max + "]");
            }
            return max;
        }
        return val;
    };
}

function createDiv(id, opt) {
    opt = opt || {};
    opt.zIndex = opt.zIndex || 0;
    let div = document.createElement("div");
    $(div).css("position", "absolute").css("height", "0px").css("width", "0px").attr("id", id).css("z-index", opt.zIndex);
    if (opt.top) {
        $(div).css("top", opt.top + "px");
    }
    if (opt.left) {
        $(div).css("left", opt.left + "px");
    }
    let parentDIV = document.getElementById(opt.parent) || document.getElementsByTagName("BODY")[0];
    parentDIV.appendChild(div);
    return div;
}

const baseUrl = "daadisplays/daa-displays-min/"; // important, baseUrl should always end with '/'

const zIndex = {
    base: 0,
    interactive: 10
};