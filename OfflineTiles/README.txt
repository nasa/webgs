Place downloaded tiles in this folder. The startup script looks here for tiles.

From the command line start the tile server while in this directory.


To install the tile server:

Check the node version you are running:
`node -v`

If not version 6 (You may need to install nvm: https://github.com/nvm-sh/nvm/blob/master/README.md):
`nvm install 6`


Install the server:
`npm install -g tileserver-gl`


Download the tiles you want from here for free, if you select the correct options (OSM, open source project):
https://openmaptiles.com/downloads/planet/

*Make sure the filename ends with .mbtiles, rename if necessary.

Run the server with the command:
`tileserver-gl <filename>`

Node may not default to version 6. `nvm list` will show you which versions are installed,
running, and default. Running `nvm alias default <version number>` will set that version to
startup when launching a new terminal.


To run webgs completely offline:
swap webgs/index.html with webgs/resources/index.html
download
bootstrap https://getbootstrap.com/
popper.js https://popper.js.org/
leaflet* https://leafletjs.com/download.html



and place these files in webgs/resources/


*If leaflet files are all in one folder move the files to the resorces folder and remove the empty folder.