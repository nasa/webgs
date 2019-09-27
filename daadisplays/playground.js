class Playground {
    constructor (displayWidgets) {
        this.playground = displayWidgets;
        let _this = this;
        // darken map to increase visibility of aircraft symbols
        $("#map-canvas").css("opacity", 0.5);
        $("#test-compass").on("click", function () {
            let val = $("#test-compass-input").val();
            console.log("Setting compass to " + val + " deg");
            _this.playground.compass.setCompass(val);
        });
        // make resolution bug visible
        $("#compass-resolution-bug").css("display", "block");
        $("#test-resolution-bug").on("click", function () {
            let val = $("#test-resolution-bug-input").val();
            console.log("Setting resolution bug to " + val);
            _this.playground.compass.setBug(val);
        });

        $("#test-airspeed").on("click", function () {
            let val = $("#test-airspeed-input").val();
            console.log("Setting airspeed to " + val + " knots");
            _this.playground.airspeed.setAirSpeed(val);
        });
        $("#test-airspeed-step").on("click", function () {
            let val = $("#test-airspeed-step-input").val();
            console.log("Setting airspeed step to " + val + " knots");
            _this.playground.airspeed.setStep(val);
        });

        $("#test-vspeed").on("click", function () {
            let val = $("#test-vspeed-input").val();
            console.log("Setting vertical speed to " + val + " x 100 feet per minute");
            _this.playground.vspeed.setVerticalSpeed(val);
        });
        $("#test-vspeed-step").on("click", function () {
            let val = $("#test-vspeed-step-input").val();
            console.log("Setting vspeed step to " + val + " 100 feet per minute");
            _this.playground.vspeed.setStep(val);
        });

        $("#test-altitude").on("click", function () {
            let val = $("#test-altitude-input").val();
            console.log("Setting altitude to " + val + " feet");
            _this.playground.altitude.setAltitude(val);
        });
        $("#test-altitude-step").on("click", function () {
            let val = $("#test-altitude-step-input").val();
            console.log("Setting altitude step to " + val + " feet");
            _this.playground.altitude.setStep(val);
        });

        $("#test-roll").on("click", function () {
            let val = $("#test-roll-input").val();
            console.log("Setting roll to " + val + " deg");
            _this.playground.vhorizon.setRoll(val);
        });
        $("#test-pitch").on("click", function () {
            let val = $("#test-pitch-input").val();
            console.log("Setting pitch to " + val + " deg");
            _this.playground.vhorizon.setPitch(val);
        });

        $("#test-location").on("click", function () {
            let val = $("#test-location-input").val();
            console.log("Setting location to " + val);
            _this.playground.map.goTo(val);
        });
        $("#test-heading").on("click", function () {
            let val = $("#test-heading-input").val();
            console.log("Setting heading to " + val);
            _this.daidalus.setHeading(val);
        });
        $("#test-heading-1").on("click", function () {
            let val = $("#test-heading-1-input").val();
            console.log("Setting heading of traffic alert to " + val);
            console.log(_this.danti.getTraffic());
            _this.danti.getTraffic()[0].setHeading(val);
        });
    }
}