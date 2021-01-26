/**
 *
 * @module MapSettings
 * @version 1.0.0
 * @description <b> map settings module </b>
 *
 * @author Andrew Peters
 * @date May 2019
 * @copyright
 * Notices:
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


// Webgs was designed to be used with MapBox as the map tile provider. This can be changed to a
// different provider, but there may be some styling issued with other maps. Getting a Mapbox
// access token is free for non-comercial limited use applications, and I would recomend it just
// based on the quality of the maps and quick loading times. If you are using Mapbox enter your
// access token here:
// ***************************************************************************************************
let token = 'token goes here. keep the quotes'
// ***************************************************************************************************

// If you are using MapBox, nothing else needs to change. But, the default zoom levels and default
// map can be changed below. If using another provider attribution and a link to the api will have
// to be added.

// For attribution update the provider name and url. All map providers require this to be displayed.
let providerURL = 'https://www.mapbox.com'
let providerName = 'Mapbox'

// enter the url for the map api here
let mapURL = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + token


// Auto updated by the variables above. This must be included on the map.
let attribution = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> ' +
    'contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="' + providerURL + '">' + providerName + '</a>'

// Open street maps are free, but are slower to load.
let osmURL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

let osm_attribution = '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'


// Default zoom level
export let zoom = 15

// How close up is the user allowed to zoom
let maxZoom = 21
let minZoom = 2

// These are some of the maps provided by Mapbox.
// Change the ID value and name for use with other tile map providers.
// If maps are removed or renamed, layers and basemaps will have to be updated.
let satellite = L.tileLayer(mapURL, {
    attribution: attribution,
    maxZoom: maxZoom,
    minZoom: minZoom,
    id: 'mapbox.satellite',
})

let dark = L.tileLayer(mapURL, {
    attribution: attribution,
    maxZoom: maxZoom,
    minZoom: minZoom,
    id: 'mapbox.dark',
})

let streets = L.tileLayer(mapURL, {
    attribution: attribution,
    maxZoom: maxZoom,
    minZoom: minZoom,
    id: 'mapbox.streets',
})

let outdoors = L.tileLayer(mapURL, {
    attribution: attribution,
    maxZoom: maxZoom,
    minZoom: minZoom,
    id: 'mapbox.outdoors',
})

let light = L.tileLayer(mapURL, {
    attribution: attribution,
    maxZoom: maxZoom,
    minZoom: minZoom,
    id: 'mapbox.light',
})

let OSM = L.tileLayer(osmURL, {
    attribution: osm_attribution,
    maxZoom: 19,
    minZoom: minZoom,
    id: 'osm'
})


// This is the default map that loads on page start or refresh.
export let layers = [OSM]

// This is the list of map options that will be displayed in the menu.
export let baseMaps = {
    // "Satellite": satellite,
    // "Streets": streets,
    // "Outdoors": outdoors,
    // "Dark": dark,
    // "Light": light,
    "OSM": OSM
}

// Default map location
export let center = [37.0866, -76.3789];

// Default line color
export let line_color = 'default'

// adjust the style of the display panels, be carefull changes here can really mess things up.
export function setMapDisplayStyle() {
    // changes style of panels when background changes
    for (let item of Object.keys(this._layers)) {
        // black text pink/tan background (I'm not sure what you call that color)
        if (this._layers[item].options.id === 'mapbox.satellite' || this._layers[item].options.id === 'mapbox.light' || this._layers[item].options.id === 'osm' || this._layers[item].options.id === 'mapbox.streets' || this._layers[item].options.id === 'mapbox.outdoors') {
            document.documentElement.style.setProperty('--main-color', 'black')
            document.documentElement.style.setProperty('--main-color2', 'white')
            document.documentElement.style.setProperty('--main-background-Head', 'rgba(233, 220, 220, 0.0)')
            document.documentElement.style.setProperty('--main-background', 'rgba(233, 220, 220, 0.5)')
            document.documentElement.style.setProperty('--main-highlight-color', 'rgba(199, 184, 184, 0.781)')
            document.documentElement.style.setProperty('--main-background-input', 'rgba(233, 220, 220, 0.1)')
            document.documentElement.style.setProperty('--main-shadow', '-1px -1px 1px rgba(233, 220, 220, 0.6), 1px -1px 1px rgba(233, 220, 220, 0.6), -1px 1px 1px rgba(233, 220, 220, 0.6), 1px 1px 1px rgba(233, 220, 220, 0.6)')

            if (this._layers[item].options.id === 'mapbox.satellite') {
                line_color = 'white' // hard to see colors on satellite images
            } else {
                line_color = 'default'
            }
        } else if (this._layers[item].options.id === 'mapbox.dark') {
            // white text blue background
            document.documentElement.style.setProperty('--main-color', 'white')
            document.documentElement.style.setProperty('--main-color2', 'black')
            document.documentElement.style.setProperty('--main-background-Head', 'rgba(171, 205, 239, 0.0)')
            document.documentElement.style.setProperty('--main-background', 'rgba(171, 205, 239, 0.3)')
            document.documentElement.style.setProperty('--main-highlight-color', 'rgba(171, 205, 239, 0.9)')
            document.documentElement.style.setProperty('--main-background-input', 'gba(171, 205, 239, 0.1)')
            document.documentElement.style.setProperty('--main-shadow', '-1px -1px 5px rgba(39, 43, 48, 0.5),  1px -1px 5px rgba(39, 43, 48, 0.5),-1px 1px 5px rgba(39, 43, 48, 0.5),1px 1px 5px rgba(39, 43, 48, 0.5)')
            line_color = 'default'
        }
    }
}