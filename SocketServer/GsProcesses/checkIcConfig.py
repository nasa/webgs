#!/usr/bin/env python3

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


import os
from argparse import ArgumentParser


def check_for_cfg_files(number, path):
    print('Checking {}'.format(path))
    return os.path.isfile(path)


def add_gs_cfg(number, path):
    gs_type = 'SOCKET'
    gs_address = '127.0.0.1'
    gs_baud = 0
    gs_portin = 14552 + (10 * number)
    gs_portout = 14553 + (10 * number)
    gsInterface_text = '# GSINTERFACE PORT CONFIG.\n# DO NOT CHANGE ORDER OF ENTRIES\nTYPE     {}\nADDRESS  {}\nBAUDRATE {}\nPORTIN   {}\nPORTOUT  {}'.format(gs_type,gs_address,gs_baud,gs_portin,gs_portout)
    str_to_text_file(gsInterface_text, path)


def add_ac_cfg(number, path):
    callsign = ['CACTUS1549', 'DOGWOOD2558', 'EUCALYPTUS3541','FERN4214','GRAPE5258','HOLLY6895','IRIS7325','JUNIPER8458','KITE9646','LOTUS1058','MAPLE1125','NETTLE1254','ORCHID1378','PECAN1404','QUEEN1590','ROSE1668','SEQUOIA1788','TULIP1840','UMBRELLA1955','VIOLET2064','WALNUT2119','XYLEM2241','YEW2333','ZINNIA2458','ACORN2518','BIRCH2636','','','','']
    aircraft_text = '#AIRCRAFT PARAMETERS\nCALLSIGN {}'.format(callsign[number])
    str_to_text_file(aircraft_text, path)


def add_ardu_cfg(number, path):
    a_type = 'SOCKET'
    a_address = '127.0.0.1'
    a_baud = 0
    a_portin = 14551 + (10 * number)
    a_portout = 0
    arducopter_text = '# ARDUCOPTER PORT CONFIG.\n# DO NOT CHANGE ORDER OF ENTRIES\nTYPE     {}\nADDRESS  {}\nBAUDRATE {}\nPORTIN   {}\nPORTOUT  {}'.format(a_type,a_address,a_baud,a_portin,a_portout)
    str_to_text_file(arducopter_text, path)


def str_to_text_file(text, name):
    with open(name, 'w') as f:
        f.write(text)


def update_cfg_files(number, path):

    gs_file = path + '/exe/ram/gsInterface{}.cfg'.format(number)
    ac_file = path + '/exe/ram/aircraft{}.cfg'.format(number)
    ardu_file = path + '/exe/ram/arducopter{}.cfg'.format(number)

    x = check_for_cfg_files(number, gs_file)
    if not x:
        print('gs: {}. Creating file: {}'.format(x, gs_file))
        add_gs_cfg(number, gs_file)

    x = check_for_cfg_files(number, ac_file)
    if not x:
        print('ac: {}. Creating file: {}'.format(x, ac_file))
        add_ac_cfg(number, ac_file)

    x = check_for_cfg_files(number, ardu_file)
    if not x:
        print('ardu: {}. Creating file: {}'.format(x, ardu_file))
        add_ardu_cfg(number, ardu_file)



if __name__ == '__main__':

    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--number", required=True,
                        default=None, nargs='*', help="icarous instance, zero based")
    parser.add_argument("--path", required=True,
                        default=None, nargs='*', help="path to icarous")

    args = parser.parse_args()
    number = int(args.number[0])
    ic_path  = args.path[0]
    print(number, ic_path)

    update_cfg_files(number, ic_path)
