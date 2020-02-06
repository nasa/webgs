/**
 *
 * @module Server
 * @version 1.0.1
 * @description <b> Traffic Module </b>
 *
 *
 * @example none
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

const express = require('express')
const helmet = require('helmet')
const bodyParser = require('body-parser')
const https = require('https')
const fs = require('fs')

const app = express()

// handle command line args
const args = process.argv.slice(2)
console.log(args)

// Recomended securty stuff -= https://expressjs.com/en/advanced/best-practice-security.html
app.use(helmet())


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}))


// parse json
app.use(bodyParser.json())


// use port 8082
app.set('port', process.env.PORT || 8082)


// redirect empty path to main page
app.get('/', (request, response) => {
    response.sendFile(__dirname + '/index.html')
})


// redirect daa-displays to dist folder - need to work with paolo to fix this
app.get('/apps/DAA/daa-displays/ColladaModels/*', (request, response) => {
    let file = request.originalUrl.split('/')
    response.sendFile(__dirname + '/apps/DAA/daa-displays/dist/daa-displays/ColladaModels/' + file[file.length - 1])
})
app.get('/apps/DAA/daa-displays/images/*', (request, response) => {
    let file = request.originalUrl.split('/')
    response.sendFile(__dirname + '/apps/DAA/daa-displays/dist/daa-displays/images/' + file[file.length - 1])
})
app.get('/apps/DAA/daa-displays/svgs/*', (request, response) => {
    let file = request.originalUrl.split('/')
    response.sendFile(__dirname + '/apps/DAA/daa-displays/dist/daa-displays/svgs/' + file[file.length - 1])
})


// opens all routes - may need to limit this later
app.use(express.static('./'))


// start the server in http or https
if (args.includes('DEV')) {
    app.listen(8082, () => {
        console.log('Server Started on Port 8082')
    })
} else {
    https.createServer({
        key: fs.readFileSync(`certs/${args[1]}`),
        cert: fs.readFileSync(`certs/${args[0]}`)
    }, app).listen(8082, () => {
        console.log('Secure Server Started on Port 8082')
    })
}