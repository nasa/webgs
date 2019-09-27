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
import sys
import time
import json
import time
import struct


from pymavlink import mavutil, mavwp, mavparm


def playbackTlog(tlog):
    print(tlog)
    # keep this it has a usefull output for testing


def readTlog(tlog, out=False):
    m = ' '
    bad = True
    single = False

    # connect to the file
    log = mavutil.mavlink_connection(
        tlog, dialect='ardupilotmega', baud=57600, write=False, planner_format=False, notimestamps=True)

    m_list = []
    x = 0
    t_prev = 0
    h = 'AIRCRAFT 1'
    ac = 1
    while m:
        # get the time stamp
        ti = log.f.read(8)
        if len(ti) != 8:
            break
        (t,) = struct.unpack('>Q', ti)

        # let the initial timestamp be the zero point for all later messages
        if x == 0:
            start = t*1.0e-6
            x = 1
        timestamp = (t*1.0e-6) - start
        h = h + ' TIME ' + str(timestamp)
        delta = timestamp - t_prev
        h = h + ' DELTA ' + str(timestamp - t_prev)
        t_prev = timestamp

        # get the message
        m = log.recv_msg()

        if m != None:
            m_list.append([ac, m, timestamp, delta])

        # Stuff for debuging
        # if out:
        #     # output as text for testing
        #     with open('../LogFiles/test_out.txt', 'a') as f:
        #         f.write(str(m)+'\n')
        #     if m.get_type() != 'None':
        #         if m.get_type() == 'MISSION_ITEM':
        #             print(tlog.timestamp)
        #             print(m)

        #         elif not single:
        #             print(tlog.timestamp)
        #             print(m)

        #     elif bad:
        #         print(tlog.timestamp)
        #         print(m)

        m_list.append([ac, m, timestamp, delta])

    log.close()
    return m_list


def readMlog(mlog, out=False):
    m = ' '
    bad = True
    single = False

    # connect to the file
    log = mavutil.mavlink_connection(
        mlog, dialect='ardupilotmega', baud=57600, write=False, planner_format=False, notimestamps=True)

    x = 0
    tprev = 0
    m_list = []
    # loop over all the messages
    while m:
        # get the ac
        head = log.f.read(8)
        if len(head) != 8:
            break
        (ac,) = struct.unpack('>Q', head)
        h = 'AIRCRAFT ' + str(ac)

        # get the time stamp
        ti = log.f.read(8)
        (t,) = struct.unpack('>Q', ti)

        # let the initial timestamp be the zero point for all later messages
        if x == 0:
            start = t*1.0e-6
            x = 1
        timestamp = (t*1.0e-6) - start
        h = h + ' TIME ' + str(timestamp)
        delta = timestamp - tprev
        h = h + ' DELTA ' + str(timestamp - tprev)
        tprev = timestamp

        # get the message
        m = log.recv_msg()

        if m != None:
            m_list.append([ac, m, timestamp, delta])

        # stuff for debuging
        if out:
            if m != None:
                # output as text for testing
                with open('../LogFiles/test_out.txt', 'a') as f:
                    f.write(h + str(m) + '\n')
                if m.get_type() != 'None':

                    if m.get_type() == 'MISSION_ITEM':
                        print(h, m)

                    elif not single:
                        print(h, m)

                elif bad:
                    print(h, m)
    log.close()
    return m_list


# Test
# readTlog('1_test.tlog)
# readMlog('merged.mlog')
