#!/usr/bin/env bash

#
# Author: Andrew Peters
#
# Copyright 2019 United States Government as represented by the Administrator of the National Aeronautics
# and Space Administration. All Rights Reserved.
#  
# Disclaimers
# No Warranty: THE SUBJECT SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF ANY
# KIND, EITHER EXPRESSED, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, ANY
# WARRANTY THAT THE SUBJECT SOFTWARE WILL CONFORM TO SPECIFICATIONS, ANY IMPLIED
# WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR FREEDOM FROM
# INFRINGEMENT, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL BE ERROR FREE, OR ANY
# WARRANTY THAT DOCUMENTATION, IF PROVIDED, WILL CONFORM TO THE SUBJECT SOFTWARE.
# THIS AGREEMENT DOES NOT, IN ANY MANNER, CONSTITUTE AN ENDORSEMENT BY GOVERNMENT
# AGENCY OR ANY PRIOR RECIPIENT OF ANY RESULTS, RESULTING DESIGNS, HARDWARE,
# SOFTWARE PRODUCTS OR ANY OTHER APPLICATIONS RESULTING FROM USE OF THE SUBJECT
# SOFTWARE.  FURTHER, GOVERNMENT AGENCY DISCLAIMS ALL WARRANTIES AND LIABILITIES
# REGARDING THIRD-PARTY SOFTWARE, IF PRESENT IN THE ORIGINAL SOFTWARE, AND
# DISTRIBUTES IT "AS IS."
#  
# Waiver and Indemnity:  RECIPIENT AGREES TO WAIVE ANY AND ALL CLAIMS AGAINST THE UNITED
# STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR
# RECIPIENT.  IF RECIPIENT'S USE OF THE SUBJECT SOFTWARE RESULTS IN ANY LIABILITIES,
# DEMANDS, DAMAGES, EXPENSES OR LOSSES ARISING FROM SUCH USE, INCLUDING ANY
# DAMAGES FROM PRODUCTS BASED ON, OR RESULTING FROM, RECIPIENT'S USE OF THE SUBJECT
# SOFTWARE, RECIPIENT SHALL INDEMNIFY AND HOLD HARMLESS THE UNITED STATES
# GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR RECIPIENT,
# TO THE EXTENT PERMITTED BY LAW.  RECIPIENT'S SOLE REMEDY FOR ANY SUCH MATTER SHALL
# BE THE IMMEDIATE, UNILATERAL TERMINATION OF THIS AGREEMENT.
#

# Get arguments - More can be added later, may need to use case statement
for arg in "$@"
do
    if [ "$arg" == "-D" ]
    then
        echo "Not building DAA Displays."
        DAA=0
    else
        DAA=1
    fi
done

# install submodules
echo "Installing Submodules:"
git submodule update --init --recursive
if [ $? = 0 ]
then
    echo "Done."
    SUBM=$?
else
    SUBM="Submodules did not install properly."
fi

# Check the submodules
INDI=./jQuery-Flight-Indicators/README.md
CONT=./Leaflet.contextmenu/README.md
ROTA=./Leaflet.RotatedMarker/README.md
SPIN=./spin.js/README.md
DAAD=./apps/DAA/daa-displays/README.md

[ ! -f "$INDI" ] && echo -e "\e[91mjQuery-Flight-Indicators submodule did not install properly.\e[39m"
[ ! -f "$CONT" ] && echo -e "\e[91mLeaflet.contextmenu submodule did not install properly.\e[39m"
[ ! -f "$ROTA" ] && echo -e "\e[91mLeaflet.RotatedMarker submodule did not install properly.\e[39m"
[ ! -f "$SPIN" ] && echo -e "\e[91mspin.js submodule did not install properly.\e[39m"
[ ! -f "$DAAD" ] && echo -e "\e[91mdaa-displays submodule did not install properly.\e[39m"

# install node modules - Assumes node and npm are installed, installs packages in package.json
if [ "which node" > /dev/null ] && [ "which npm" > /dev/null ]
then
    echo "Node found: $(which node)"
    echo "Installing Node Modules:"
    npm install
    if [ $? = 0 ]
    then
        echo "Done."
        NPMI=$?
    else
        NPMI="Node modules did not install properly."
    fi
else
    echo "Make sure node and npm are installed. Then run 'npm install' in this directory."
    NPMI="Unable to find node or npm."
fi

# install python requirements, installs packages in requirements.txt
echo "Installing Python Requirements: - This can take some time."
pip3 -q install -r requirements.txt
if [ $? = 0 ]
then
    echo "Done."
    PY3I=$?
else
    PY3I="Python 3 requirements did not install properly."
fi


if [ "$DAA" != 0 ] && [ -f "$DAAD" ]
then
    # build DAA Displays - check requirements first
    echo "Building DAA Displays:"
    cd ./apps/DAA/daa-displays/
    make
    INST=$?
    npm install
    cd ../../../
    if [ $INST = 0 ]
    then
        DAAI=$INST
    else
        DAAI="DAA displays did not build correctly."
    fi
else
    DAAI=0
fi


# Finished
echo "************************************************************************************************************"
if [ "$SUBM" = "0" ] && [ "$NPMI" = "0" ] && [ "$PY3I" = "0" ] && [ "$DAAI" = "0" ]
then
    echo -e "\e[39m\n"
    echo "Installation Complete"
    echo -e "\e[39m\n"
    echo "To start WebGS using http run:"
    echo -e "\t\e[32m'python3 start_webgs.py -DEV True'"
    echo -e "\e[39mor to use https, "
    echo -e "\t\e[32m'python3 start_webgs.py -HOST {name or localhost}'"
    echo -e "\e[39mor, "
    echo -e "\t\e[32m'python3 start_webgs.py -HOST {name or localhost} -CERT {filename}.crt -KEY {filename}.key'"
    echo -e "\e[39m\n"
    echo -e "Also, to not auto launch a browser window use: \e[32m'-NOBROWSER True'"
    echo -e "\e[39m\n"
else
    echo "There was a problem with the installation."
    echo -e "\e[39m\n"
    for i in "$SUBM" "$NPMI" "$PY3I" "$DAAI";
    do
        if [ "$i" != 0 ]
        then
            echo -e "\t\e[91m$i"
            echo -e "\e[39m\n"
        fi
    done

    echo -e "\e[39mPlease check the output to correct the errors."
fi
echo "************************************************************************************************************"