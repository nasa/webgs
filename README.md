# WEB GS

Web GS is a web-based ground control station that is compatible with [ICAROUS](https://github.com/nasa/ICAROUS/), version greater than 2.1.26, and capable of multi-aircraft simulations.

![](screenshots/screenshot1_webgs.png)
![](screenshots/screenshot2_webgs.png)
![](screenshots/screenshot4_webgs.png)
![](screenshots/screenshot3_webgs.png)

### Instalation:

After cloning this repository run `git submodule update --init --recursive` to clone the submodules.

Python3 is required to run the socket server. After python3 is installed, install the required packages:

    cd into the webgs directory
    pip3 install -r requirements.txt

Make sure you have installed node.js and npm. https://www.npmjs.com/get-npm
Then install a simple http-server: https://www.npmjs.com/package/http-server

Webgs is configured to use mapbox for the background display. To get an authorization key go to https://www.mapbox.com/ and create an account. After receiving an authorization token open /webgs/MainJS/MapSettings.js in a text editor, and follow the instructions to update.

Webgs is also setup to connect to Open Street Maps, and instructions are included in the MapSettings file for setting up an offline tile server.

### Startup:

    Open a terminal and cd into the webgs directory then,

    python3 start_webgs.py

    This script starts a local http server, starts the webgs socket server, and opens the default web browser (preferably a current version of chrome) to `localhost:8082`

    or, the components can be run individually:

    http-server -p 8082 -i
    python3 multiprocessing_server.py
    and navigate to localhost:8082 in a browser.

    There are potentially some compatibility issues with browsers other than Chrome and Firefox. These issues are mainly just styling. There may be some weird colors, or things may be slightly out of place.

### To connect to the server from another device (only if on the same local network):

    If the web server and socket server are on another device on your local network. *The server is not public facing, and will not be seen by anyone outside of the local network.
    1. Enter the ip address of the machine running the web server into the browser address bar in format - <ip adress>:8082
    2. From the settings panel Under Connect to Remote Host, change the IP Address to the device the socket server is running on (The port should not change). Then Press the Create New Connection button.

### Connect WebGS to Jetson/PX4 over UDP:

    Assuming Icarous is configured properly:
    1. Ensure you are on the same network as the device running Icarous. Typically this will involve changing the IP address of your machine.
    2. Start the web server and the socket server. Ensure the Web page is connected to the socket server.
    3. In the settings panel, set:
        GCS Mode -> 'Connect to Hardware'
        Select Input Type -> IP
        IP Address -> {the same IP address Icarous is configured to output to}
    4. Ensure the Port and Baud Rate are correct.
    5. Press connect to aircraft.

### Connect WebGS to Jetson/PX4 via Serial USB Device:

    Assuming Icarous is configured properly:
    1. Ensure you are on the same network as the device running Icarous. Typically this will involve changing the IP address of your machine.
    2. Start the web server and the socket server. Ensure the Web page is connected to the socket server.
    3. In the settings panel, set:
        GCS Mode -> 'Connect to Hardware'
        Select Input Type -> USB
        IP Address -> {the same IP address Icarous is configured to output to}
    4. Ensure the Port and Baud Rate are correct.
    5. Press connect to aircraft.

### To run simulations:

    1. Icarous must be installed and properly built.
    2. On the settings page ensure

        GCS Mode is set to 'SITL'
        Path to icarous is set correctly
        Path to Ardupilot is set correctly (if needed)

    3. Change icarous startup apps if needed.
    4. Then either right click on the map or click on the Aircraft button and select 'New Aircraft'
    5. The parameters for Icarous in version 2 are auto loaded. They may need to be changed.

### To view own-ship perspective flight instruments:

    After the aircraft has started, click Open DAA Display. This will open the display in a new tab. This is currently only configured to show information for Aircraft 1. Currently this display only works on port 8082. If the server was launched on another port the map will not be displayed.

### Playback

Webgs uses the MAVProxy format for creating .tlog files for each flight. These files along with the Server logs, Icarous outputs, ardupilot outputs, and a text file containing all of the received mavlink messages are stored in the LogFiles directory. To playback a file:

    1. Change the GCS Mode to Playback
    2. Enter the file name in the text box. (It assumes files will be located in the LogFiles directory.)
    3. Click Start Playback. It may take a few seconds to load the file.

    Note: I would not recommend fast forwarding at the beginning of the file. If you miss the flight plan messages, a flight plan will not show up on the map.

### Merging .tlog files for multi-aircraft playback:

    1. A Python3 script has been included for creating a .mlog file that webgs is capable of playing.
    2. It is located in webgs/ServerFiles/
    3. python3 mergeTlogs.py -h or --help for instructions on how to use it.

### Fly By File

Webgs is capable of flying scripted scenarios that are repeatable and adjustable. Functionality is still limited but it has been tested with four simulated aircraft flying simultaneously, each with multiple intruders and a geofence, repeated 50 times, adjusting parameters, flight plans, and intruders after 25 flights. Examples and instructions on building a script are located in `/webgs/Examples/TestScripts`.


### Current version:

Web GS v1.0.4

### Notices:

Copyright 2019 United States Government as represented by the Administrator of the National Aeronautics
and Space Administration. All Rights Reserved.

Disclaimers
No Warranty: THE SUBJECT SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF ANY
KIND, EITHER EXPRESSED, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, ANY
WARRANTY THAT THE SUBJECT SOFTWARE WILL CONFORM TO SPECIFICATIONS, ANY IMPLIED
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR FREEDOM FROM
INFRINGEMENT, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL BE ERROR FREE, OR ANY
WARRANTY THAT DOCUMENTATION, IF PROVIDED, WILL CONFORM TO THE SUBJECT SOFTWARE.
THIS AGREEMENT DOES NOT, IN ANY MANNER, CONSTITUTE AN ENDORSEMENT BY GOVERNMENT
AGENCY OR ANY PRIOR RECIPIENT OF ANY RESULTS, RESULTING DESIGNS, HARDWARE,
SOFTWARE PRODUCTS OR ANY OTHER APPLICATIONS RESULTING FROM USE OF THE SUBJECT
SOFTWARE.  FURTHER, GOVERNMENT AGENCY DISCLAIMS ALL WARRANTIES AND LIABILITIES
REGARDING THIRD-PARTY SOFTWARE, IF PRESENT IN THE ORIGINAL SOFTWARE, AND
DISTRIBUTES IT "AS IS."

Waiver and Indemnity:
RECIPIENT AGREES TO WAIVE ANY AND ALL CLAIMS AGAINST THE UNITED
STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR
RECIPIENT.  IF RECIPIENT'S USE OF THE SUBJECT SOFTWARE RESULTS IN ANY LIABILITIES,
DEMANDS, DAMAGES, EXPENSES OR LOSSES ARISING FROM SUCH USE, INCLUDING ANY
DAMAGES FROM PRODUCTS BASED ON, OR RESULTING FROM, RECIPIENT'S USE OF THE SUBJECT
SOFTWARE, RECIPIENT SHALL INDEMNIFY AND HOLD HARMLESS THE UNITED STATES
GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR RECIPIENT,
TO THE EXTENT PERMITTED BY LAW.  RECIPIENT'S SOLE REMEDY FOR ANY SUCH MATTER SHALL
BE THE IMMEDIATE, UNILATERAL TERMINATION OF THIS AGREEMENT.

### Contact

Andrew Peters andrew.peters@nianet.org
Cesar Munoz cesar.a.munoz@nasa.gov
