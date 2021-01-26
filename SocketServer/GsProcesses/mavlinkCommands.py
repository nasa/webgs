#!/usr/bin/env python3

#
# Author: Andrew Peters
#
# Edited 9/3/2019 - added target component global - andrew peters
#
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

import time
from pymavlink import mavutil, mavwp
import struct
import logging
import sys
import math
from random import random

count = 0
count1 = 0
s = 0.00001
msg_count_array = [0,0,0,0,0,0,0,0,0,0]
start = time.time()
msg_count = 1  # avoid divide by zero
m_count = 1
none_count = 0
bad_count = 0
pre_seq = 0
missing = 0
targetComponent = 5

# Util


def setTargetComponent(comp):
    global targetComponent
    targetComponent = comp
    print('setTargetComponent', targetComponent)


# Mavlink Commands

def requestDataStream(BAUD, master):
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    master.mav.request_data_stream_send(master.target_system,
                                        component,
                                        mavutil.mavlink.MAV_DATA_STREAM_ALL,
                                        BAUD,
                                        1)


def recvAndLog(master, mlog, forwarding):
    global s
    global count
    global count1
    global msg_count


    if master != 'NONE' and master is not None:
        master.pre_message()
        m = master.recv()
        msg = []
        if len(m) > 0:

            if master.first_byte:
                master.auto_mavlink_version(m)
            try:
                msg.append(master.mav.parse_char(m))
            except UnicodeDecodeError as e:
                print(e)
                print(m)
                msg.append(None)

            # mlog.write(m)          use this to generate a tlog.raw\

            if msg[0] is not None:
                try:
                    q = msg[0]._instance_field
                    # print(q)
                except:    
                    msg[0]._instance_field = None
                
                master.post_message(msg[0])
                usec = int(time.time() * 1.0e6)
                usec = (usec & ~3 | 3)
                x = bytearray(struct.pack('>Q', usec)) + m
                mlog.write(x)
                # print(x)
                # print(msg[0])
                if forwarding is not None:
                    forwarding.mav.seq = msg[0].get_seq()
                    forwarding.mav.srcSystem = msg[0].get_srcSystem()
                    forwarding.mav.srcComponent = msg[0].get_srcComponent()
                    # if msg[0].name == 'GLOBAL_POSITION_INT':
                    #     # print(msg[0])
                    #     new_m = forwarding.mav.global_position_int_encode(
                    #         msg[0].time_boot_ms, 
                    #         msg[0].lat, 
                    #         msg[0].lon, 
                    #         msg[0].relative_alt, 
                    #         msg[0].relative_alt, 
                    #         msg[0].vx, 
                    #         msg[0].vy, 
                    #         msg[0].vz, 
                    #         msg[0].hdg)

                    #     y = new_m.pack(forwarding.mav)
                    #     forwarding.write(y)
                        
                    #     count += 1
                    #     if count > 5:
                    #         # if using rotorsim we will need to inject vfr_hud messages, and battery message
                    #         s = math.sqrt((msg[0].vx / 100) ** 2 + (msg[0].vy/100)**2)
                    #         new_m = forwarding.mav.vfr_hud_encode(s, 100.0, int(msg[0].hdg * .01), 0, msg[0].relative_alt, msg[0].vz)
                    #         y = new_m.pack(forwarding.mav)
                    #         forwarding.write(y)

                    #         # need to use the sys_status message for battery remaining
                    #         new_m = forwarding.mav.battery_status_encode(0, 0, 3, 2000, [
                    #            1258, 65535, 65535, 65535, 65535, 65535, 65535, 65535, 65535, 65535], -1, -1, -1, 60)
                    #         y = new_m.pack(forwarding.mav)
                    #         forwarding.write(y)
                    #         count = 0

                    # elif msg[0].name == 'HEARTBEAT':
                    #     # inject a heartbeat
                    #     # new_m = forwarding.mav.heartbeat_encode(14, 3, 81, 0, 3, 3)
                    #     # print(msg[0])
                    #     new_m = forwarding.mav.heartbeat_encode(
                    #         msg[0].type, 
                    #         msg[0].autopilot, 
                    #         msg[0].base_mode, 
                    #         msg[0].custom_mode, 
                    #         msg[0].system_status, 
                    #         msg[0].mavlink_version)
                    #     y = new_m.pack(forwarding.mav)
                    #     forwarding.write(y)
                        
                    #     # inject a sys_status message
                    #     new_m = forwarding.mav.sys_status_encode(56743199, 39918639, 57653199, 550, 24907, 0, 100, 0, 0, 0, 0, 0, 0)
                    #     y = new_m.pack(forwarding.mav)
                    #     forwarding.write(y)

                    # elif msg[0].name == 'MISSION_COUNT':
                    #     new_m = forwarding.mav.mission_count_encode(
                    #         msg[0].target_system, 
                    #         msg[0].target_component, 
                    #         msg[0].count, 
                    #         msg[0].mission_type)
                    #     y = new_m.pack(forwarding.mav)
                    #     forwarding.write(y)

                    # elif msg[0].name == 'MISSION_ITEM':
                    #     new_m = forwarding.mav.mission_item_encode(
                    #         msg[0].target_system,
                    #         msg[0].target_component,
                    #         msg[0].seq,
                    #         msg[0].frame,
                    #         msg[0].command, 
                    #         msg[0].current,
                    #         msg[0].autocontinue,
                    #         msg[0].param1,
                    #         msg[0].param2,
                    #         msg[0].param3,
                    #         msg[0].param4, 
                    #         msg[0].x, 
                    #         msg[0].y, 
                    #         msg[0].z, 
                    #         msg[0].mission_type)
                    #     y = new_m.pack(forwarding.mav)
                    #     forwarding.write(y)

                    # elif msg[0].name == 'PARAM_VALUE':
                    #     try:
                    #         new_m = forwarding.mav.param_value_encode(
                    #             msg[0].param_id,
                    #             msg[0].param_value,
                    #             msg[0].param_type,
                    #             msg[0].param_count, 
                    #             msg[0].param_index)
                    #         y = new_m.pack(forwarding.mav)
                    #         forwarding.write(y)
                    #     except:
                    #         print(msg[0])
                    
                    # elif msg[0].name == 'STATUSTEXT':
                    #     try:
                    #         new_m = forwarding.mav.statustext_encode(
                    #             msg[0].severity,
                    #             str(msg[0].text))
                    #         y = new_m.pack(forwarding.mav)
                    #         forwarding.write(y)
                            
                    #         if msg[0].text == 'IC:Starting Mission':
                    #             custom_mode = 1
                    #         elif msg[0].text == 'IC: Landing':
                    #             custom_mode = 5
                    #         else: 
                    #             return ([None], 0, 0)

                    #         new_m = forwarding.mav.heartbeat_encode(
                    #             msg[0].type, 
                    #             msg[0].autopilot, 
                    #             msg[0].base_mode, 
                    #             custom_mode, 
                    #             msg[0].system_status, 
                    #             msg[0].mavlink_version)
                    #         y = new_m.pack(forwarding.mav)
                    #         forwarding.write(y)
                            
                    #     except: 
                    #         print(msg[0])
                    # else:
                    #     print(msg[0])
                    forwarding.write(m)

                # Turn this on for message injection into master
                # else:
                #     if msg[0].name == 'GLOBAL_POSITION_INT':
                #         if count1 > 5:                           #, type,min,max type,min,max type,min,max type,min,max type,min,max
                #             # test band fragmentation
                #             msg.append(master.mav.icarous_kinematic_bands_encode(8, 0,0.0,45.0,  1,45.1,90.0, 2,90.1,135.0, 3,135.1,180.0, 4,180.1,225.0 ))
                #             msg.append(master.mav.icarous_kinematic_bands_encode(8, 5,225.1,270.0,  1,270.1,315.0, 2,315.1,360.0, 6,0,0, 0,0,0 ))

                #             # test band types
                #             # normal
                #             # msg.append(master.mav.icarous_kinematic_bands_encode(5, 1,0,72.0,  2,72.1,144.0, 3,144.1,216.0, 4,216.1,288.0, 5,288.1,360.0 ))
                #             # hspeed
                #             msg.append(master.mav.icarous_kinematic_bands_encode(5, 8,0,20,  9,20,40, 10,40,60, 11,60,80, 12,80,100 ))
                #             # alt
                #             msg.append(master.mav.icarous_kinematic_bands_encode(5, 15,0,50,  16,50,100, 17,100,150, 18,150,200, 19,200,250 ))
                #             # vspeed
                #             msg.append(master.mav.icarous_kinematic_bands_encode(5, 22,-8,-4,  23,-4,0, 24,0,4, 25,4,8, 26,8,24 ))

                #             count1 = 0
                #         else:
                #             count1 +=1

                if forwarding != 'NONE' and forwarding is not None:
                    forwarding.pre_message()
                    m = forwarding.recv()
                    fmsg = []
                    if len(m) > 0:

                        if forwarding.first_byte:
                            forwarding.auto_mavlink_version(m)
                        try:
                            fmsg.append(forwarding.mav.parse_char(m))
                        except UnicodeDecodeError as e:
                            print(e)
                            print(m)
                            fmsg.append(None)

                        # mlog.write(m)          use this to generate a tlog.raw\

                        if fmsg[0] is not None:
                            try:
                                q = fmsg[0]._instance_field
                                print(q)
                            except:    
                                fmsg[0]._instance_field = None
                            forwarding.post_message(fmsg[0])
                            usec = int(time.time() * 1.0e6)
                            usec = (usec & ~3 | 3)
                            x = bytearray(struct.pack('>Q', usec)) + m
                            mlog.write(x)
                            # print(x)
                            # print(fmsg[0])
                            if master is not None:
                                master.mav.seq = fmsg[0].get_seq()
                                master.mav.srcSystem = fmsg[0].get_srcSystem()
                                master.mav.srcComponent = fmsg[0].get_srcComponent()
                                
                                # if fmsg[0].name == 'PARAM_REQUEST_LIST':
                                #     # inject a heartbeat
                                #     new_m = master.mav.param_request_list_encode(
                                #         fmsg[0].target_system, 
                                #         fmsg[0].target_component)
                                #     y = new_m.pack(master.mav)
                                #     master.write(y)

                                # elif fmsg[0].name == 'MISSION_REQUEST':
                                #     new_m = master.mav.mission_request_encode(
                                #         fmsg[0].target_system, 
                                #         fmsg[0].target_component, 
                                #         fmsg[0].seq,
                                #         fmsg[0].mission_type)
                                #     y = new_m.pack(master.mav)
                                #     master.write(y)

                                # elif fmsg[0].name == 'MISSION_REQUEST_LIST':
                                #     new_m = master.mav.mission_request_list_encode(
                                #         fmsg[0].target_system, 
                                #         fmsg[0].target_component, 
                                #         fmsg[0].mission_type)
                                #     y = new_m.pack(master.mav)
                                #     master.write(y)
                                # else:
                                #     print('FORWARDING: {}'.format(fmsg[0]))
                                master.write(m)
                    
            else:
                if forwarding is not None:
                    forwarding.write(m)

            # good for debuging
            # (tusec,) = struct.unpack('>Q', x[0:8])
            # print(usec, tusec, len(x), len(m), len(x)-len(m), m,  x)

            percent, percent_missing = calcRadioQuality(msg[0])
            return (msg, percent, percent_missing)
        else:
            return ([None], 0, 0)
    else:
        msg_count = 0
        return ([None], 0, 0)

def calcRadioQuality(msg):
    global msg_count
    global m_count
    global none_count
    global bad_count
    global missing
    global pre_seq
    global msg_count_array
    global start
    test = False

    if (time.time() - start) > .25:
        # Test degraded comms
        if test:
            rand = random()
            if rand >= .8:
                msg = 'BAD_DATA'

        if 'BAD_DATA' in str(msg):
            bad_count += 1
        elif msg is not None:

            if (time.time() - start) >.5:
                percent_missing = int(missing / (msg_count + missing) * 100)
                msg_count_array.append(percent_missing)
                msg_count_array.pop(0)
                missing = 0
                m_count = 1
                start = time.time()

            msg_count += 1
            m_count +=1

            seq = msg.get_seq()
            if seq != pre_seq+1 and seq != 0:
                missing = abs(missing + (seq - pre_seq))
            pre_seq = seq

    percent = int(msg_count/(msg_count+bad_count) * 100)
    percent_missing = sum(msg_count_array[:])/1000
    return percent, percent_missing


def recvMatchAndLog(master, mlog, forwarding, t):
    logger = logging.getLogger()
    t_now = time.time()
    timeout = 2

    while True:
        msg = recvAndLog(master, mlog, forwarding)
        msg = msg[0][0]

        if msg is not None:
            match = [x for x in t if x in str(msg)]
            if len(match) > 0:
                logger.info('recv, match, and log {}'.format(msg))
                print('Recieved: ', msg)
                # print('Msg Comp:', msg.get_srcComponent())
                return msg

        elif time.time() - t_now > timeout:
            print('Request Timeout:', t)
            return


def sendHeartbeat(master):
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    master.mav.command_long_send(master.target_system,
                                 component,
                                 mavutil.mavlink.HEARTBEAT,
                                 0,  # confirmation
                                 6,  # type
                                 8,  # autopilot
                                 0,  # base mode
                                 0,  # custom mode
                                 0,  # status
                                 3,  # version
                                 0
                                 )


def requestCount(master, mlog, forwarding):
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    # print('comp',component)
    master.mav.mission_request_list_send(master.target_system,
                                         component,
                                         mavutil.mavlink.MAV_MISSION_TYPE_MISSION)

    msg_in = recvMatchAndLog(master, mlog, forwarding, ['MISSION_COUNT'])
    return msg_in


def requestCountF(master, mlog, forwarding):
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    # print('comp',component)
    master.mav.mission_request_list_send(master.target_system,
                                         component,
                                         mavutil.mavlink.MAV_MISSION_TYPE_FENCE)

    msg_in = recvMatchAndLog(master, mlog, forwarding, ['MISSION_COUNT'])
    return msg_in


def requestCountR(master, mlog, forwarding):
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    # print('comp',component)
    master.mav.mission_request_list_send(master.target_system,
                                         component,
                                         mavutil.mavlink.MAV_MISSION_TYPE_RALLY)

    msg_in = recvMatchAndLog(master, mlog, forwarding, ['MISSION_COUNT'])
    return msg_in


def requestWaypoints(i, master, mlog, forwarding):
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    master.mav.mission_request_send(master.target_system,
                                    component,
                                    i,
                                    mavutil.mavlink.MAV_MISSION_TYPE_MISSION)
    msg_in = recvMatchAndLog(master, mlog, forwarding, ['MISSION_ITEM'])
    return msg_in


def requestVert(i, master, mlog, forwarding):
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    # print('comp',component)
    master.mav.mission_request_send(master.target_system,
                                    component,
                                    i,
                                    mavutil.mavlink.MAV_MISSION_TYPE_FENCE)
    msg_in = recvMatchAndLog(master, mlog, forwarding, ['MISSION_ITEM'])
    return msg_in


def requestReplan(i, master, mlog, forwarding):
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    master.mav.mission_request_send(master.target_system,
                                    component,
                                    i,
                                    mavutil.mavlink.MAV_MISSION_TYPE_RALLY)
    msg_in = recvMatchAndLog(master, mlog, forwarding, ['MISSION_ITEM'])
    return msg_in


def setFlightMode(mode, master, mlog, forwarding):
    logger = logging.getLogger()
    mode_id = master.mode_mapping()[mode]
    logger.info('SERVER: Mode Id {}'.format(mode_id))
    master.mav.set_mode_send(
        master.target_system,
        mavutil.mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED,
        mode_id)

    msg_in = recvMatchAndLog(master, mlog, forwarding, ['COMMAND_ACK'])
    logger.info('SERVER: Set Mode: {}'.format(msg_in))


def sendClearMission(master, mlog, forwarding):
    logger = logging.getLogger()
    # Clear old WP's
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    master.mav.mission_clear_all_send(master.target_system,
                                      component,
                                      mavutil.mavlink.MAV_MISSION_TYPE_ALL)

    msg_in = recvMatchAndLog(master, mlog, forwarding, ['MISSION_ACK'])
    logger.info('SERVER: Clear Mission {}'.format(msg_in))


def setHome(point, master, mlog, forwarding):
    logger = logging.getLogger()
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    master.mav.command_long_send(master.target_system, component,
                                    #  mavutil.mavlink.MAV_CMD_DO_SET_HOME,
                                    179,
                                     0,  # confirmation number
                                     # param1 - 0 specified location, 1 current location
                                     0,
                                     0,  # param2
                                     0,  # param3
                                     0,  # param4
                                     float(point[0]),  # param5 - lat
                                     float(point[1]),  # param6 - lng
                                     float(10))  # param7 - alt
    logger.info('SERVER: Setting Home to {}, {}, {}'.format(point[0],point[1],10))

def sendMissionCount(wp_list, master, mlog, forwarding):
    # Let the system know how many wp's to expect
    count = len(wp_list) + 1
    print('Mission count: ', count)
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    master.mav.mission_count_send(master.target_system,
                                  component,
                                  count,
                                  mavutil.mavlink.MAV_MISSION_TYPE_MISSION)
    msg_in = recvMatchAndLog(master, mlog, forwarding, ['MISSION_REQUEST'])
    return msg_in


def sendTakeoff(point, radius, seq, master, mlog, forwarding):
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    master.mav.mission_item_send(master.target_system,
                                 component,
                                 seq,
                                 0,
                                 mavutil.mavlink.MAV_CMD_NAV_TAKEOFF,
                                 0, 0, 0, radius, 0, 0,
                                 float(point[0]),
                                 float(point[1]),
                                 float(point[2]),
                                 mavutil.mavlink.MAV_MISSION_TYPE_MISSION)

    msg_in = recvMatchAndLog(master, mlog, forwarding, [
        'MISSION_REQUEST', 'MISSION_ACK'])
    return msg_in


def sendVelocity(vel, master, mlog, forwarding):
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    master.mav.mission_item_send(master.target_system,
                                 component,
                                 1,
                                 0,
                                 mavutil.mavlink.MAV_CMD_DO_CHANGE_SPEED,
                                 0, 1, 0, vel, 0, 0,
                                 0,
                                 0,
                                 0,
                                 mavutil.mavlink.MAV_MISSION_TYPE_MISSION)

    msg_in = recvMatchAndLog(master, mlog, forwarding, [
        'MISSION_REQUEST', 'MISSION_ACK'])
    return msg_in


def sendWaypoint(point, radius, seq, master, mlog, forwarding):
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent

    print('sendWaypoint: component, targetComponent', component, targetComponent)
    master.mav.mission_item_send(master.target_system,
                                 component,
                                 seq,
                                 mavutil.mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT,
                                 mavutil.mavlink.MAV_CMD_NAV_WAYPOINT,
                                 0, 0, 0, radius, 0, 0,
                                 float(point[0]),
                                 float(point[1]),
                                 float(point[2]),
                                 mavutil.mavlink.MAV_MISSION_TYPE_MISSION)

    msg_in = recvMatchAndLog(master, mlog, forwarding, [
        'MISSION_REQUEST', 'MISSION_ACK'])
    return msg_in


def startFlight(icarous_flag, launch, master, mlog, forwarding):
    logger = logging.getLogger()
    print('Launch Code:', launch)
    if icarous_flag == '1':
        global targetComponent
        if targetComponent is None:
            component = master.target_component
        else:
            component = targetComponent
        master.mav.command_long_send(master.target_system, component,
                                     mavutil.mavlink.MAV_CMD_MISSION_START,
                                     0,  # confirmation number
                                     # param1 - 0 launch, 1 start icarous without taking off
                                     float(launch),
                                     0,  # param2
                                     0,  # param3
                                     0,  # param4
                                     0,  # param5
                                     0,  # param6
                                     0)  # param7

        return

    else:
        # change mode to guided
        mode = master.mode_mapping()['GUIDED']
        master.mav.set_mode_send(
            master.target_system,
            mavutil.mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED,
            mode)

        msg_in = recvMatchAndLog(master, mlog, forwarding, ['COMMAND_ACK'])
        logger.info('SERVER: message in {}'.format(msg_in))

        # arm the quad
        master.mav.command_long_send(master.target_system, master.target_component,
                                     mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
                                     0,
                                     1, 0, 0, 0, 0, 0, 0)
        msg_in = recvMatchAndLog(master, mlog, forwarding, ['COMMAND_ACK'])
        logger.info('SERVER: message in {}'.format(msg_in))
        time.sleep(1)

        # Throttle up
        master.mav.command_long_send(master.target_system, master.target_component,
                                     mavutil.mavlink.MAV_CMD_DO_CHANGE_SPEED,
                                     0,
                                     0, 10, 10, 1, 0, 0, 0)
        msg_in = recvMatchAndLog(master, mlog, forwarding, ['COMMAND_ACK'])
        logger.info('SERVER: message in {}'.format(msg_in))
        time.sleep(1)

        # Takeoff
        master.mav.command_long_send(master.target_system, master.target_component,
                                     mavutil.mavlink.MAV_CMD_NAV_TAKEOFF,
                                     0,
                                     0, 0, 0, 0, 37.0866015, -76.3788989, 15)
        msg_in = recvMatchAndLog(master, mlog, forwarding, ['COMMAND_ACK'])
        logger.info('SERVER: message in {}'.format(msg_in))
        time.sleep(1)

        # change mode to Auto
        mode = master.mode_mapping()['AUTO']
        master.mav.set_mode_send(
            master.target_system,
            mavutil.mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED,
            mode)
        msg_in = recvMatchAndLog(master, mlog, forwarding, ['COMMAND_ACK'])
        return str(msg_in)


def resetIcarous(master):
    print('Sending icarous reset')
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    master.mav.command_long_send(master.target_system, component,
                                 mavutil.mavlink.MAV_CMD_USER_1,
                                 0,
                                 0, 0, 0, 0, 0, 0, 0)


def sendGFEnable(index, f_type, total, floor, roof, master, mlog, forwarding):
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    master.mav.command_long_send(master.target_system,
                                 component,
                                 mavutil.mavlink.MAV_CMD_DO_FENCE_ENABLE,
                                 0,
                                 1.0,         # enable fence
                                 float(index),     # index
                                 # type 0 = keep in, 1 = keep out
                                 float(f_type),
                                 float(total),     # total
                                 float(floor),     # floor
                                 float(roof),      # roof
                                 0.0)         # unused

    msg_in = recvMatchAndLog(
        master, mlog, forwarding, ['FENCE_FETCH_POINT', 'COMMAND_ACK'])
    return msg_in


def sendGFPoint(seq, total, item, master, mlog, forwarding):
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    master.mav.fence_point_send(master.target_system,
                                component,
                                seq,
                                total,
                                float(item[0]),
                                float(item[1]))

    msg_in = recvMatchAndLog(
        master, mlog, forwarding, ['FENCE_FETCH_POINT', 'COMMAND_ACK'])
    return msg_in


def removeGF(index, floor, roof, master):
    # overwrite current fence with a 0 point fence
    # not working
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    master.mav.command_long_send(master.target_system,
                                 component,
                                 mavutil.mavlink.MAV_CMD_DO_FENCE_ENABLE,
                                 0,
                                 0,         # enable fence
                                 index,     # index
                                 0,         # type 0 = keep in, 1 = keep out
                                 0,         # total
                                 floor,     # floor
                                 roof,      # roof
                                 0)         # unused


def fetchParams(master):
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    master.mav.param_request_list_send(
        master.target_system, component)


def changeParamInt(consumer_message, master, mlog, forwarding):
    logger = logging.getLogger()
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    master.mav.param_set_send(master.target_system, component,
                              consumer_message[1].encode(
                                  'utf8'),
                              int(consumer_message[2]),
                              int(consumer_message[3]))

    msg_in = recvMatchAndLog(master, mlog, forwarding, ['PARAM_VALUE'])
    logger.info('SERVER: message in {}'.format(msg_in))


def changeParamFloat(consumer_message, master, mlog, forwarding):
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    logger = logging.getLogger()
    master.mav.param_set_send(master.target_system, component,
                              consumer_message[1].encode(
                                  'utf8'),
                              float(consumer_message[2]),
                              int(consumer_message[3]))

    msg_in = recvMatchAndLog(master, mlog, forwarding, ['PARAM_VALUE'])
    logger.info('SERVER: message in {}'.format(msg_in))

def sendTraffic(m, master):
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    master.mav.command_long_send(1,  # target_system
                                 component,  # target_component
                                 mavutil.mavlink.MAV_CMD_SPATIAL_USER_1,  # command
                                 0,  # confirmation
                                 float(m[1])*10,  # param1
                                 float(m[2]),  # param2
                                 float(m[3]),  # param3
                                 float(m[4]),  # param4
                                 float(m[5]),  # param5
                                 float(m[6]),  # param6
                                 float(m[7]))  # param7


def sendUser3(command, master):
    global targetComponent
    if targetComponent is None:
        component = master.target_component
    else:
        component = targetComponent
    master.mav.command_long_send(master.target_system,
                                 component,
                                 mavutil.mavlink.MAV_CMD_USER_3,
                                 0,
                                 int(command),  # 1 = on, 0 = off
                                 0,             # unused
                                 0,             # unused
                                 0,             # unused
                                 0,             # unused
                                 0,             # unused
                                 0)             # unused
