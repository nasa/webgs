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
import logging
import traceback

from ServerFiles.traffic import Traffic as T
from ServerFiles.trafficManager import TrafficManager
import ServerFiles.consumerFunctions as CF
import ServerFiles.mavlinkCommands as MF
import ServerFiles.gfManager as GF
import ServerFiles.readLogFile as RT
import ServerFiles.playback as P
import ServerFiles.IcClass as I

from pymavlink import mavutil, mavwp, mavparm


ic = I.IcClass()
HOST = '0.0.0.0'
IP = '169.254.1.12'
PORT = 8000
UDP_PORT_1 = 14550
UDP_PORT_2 = 14553
RADIO = 'dev/ttyUSB0'
BAUD = 57600
ac_pids = []
da = int(time.time())
da_formated = time.strftime(
    "%Y-%m-%d_%H:%M:%S", time.localtime(da))
logplayer = None
wp_count = {}
wp_list = {}
v_count = {}  # number of verticies per ac
f_list = {}   # number of verticies per fence
gf_list = {}  # list of verts {ac1: [v0, v1, v2, ...]}
r_count = {}
r_list = {}
ac = 'NONE'
hitl = False
has_heartbeat = False
forwarding = None
sim_type = None
starttime_now = time.time()


def data(q, m):
    # Create a Trafic manager instance
    TM = TrafficManager()
    master = 'NONE'
    logger = logging.getLogger()

    mlog = None
    while True:
        # get messages from ac
        if master != 'NONE' or master != 'END':
            update_position(q, TM, master, mlog, forwarding)

        # execute commands from gs
        if len(m) > 0:
            logger.info('IC {}: Message: {}'.format(ac, str(m[0])))
            if m[0][1] != '-1':
                master, mlog = completeCommands(q, m[0], TM, master, mlog)

            if "NEW_AIRCRAFT" in m[0]:
                global sim_type
                sim_type = m[0][10]
                logger.info('IC {}: Waiting for Icarous to load.'.format(ac))
                d = int(time.time())
                d_formated = time.strftime(
                    "%Y-%m-%d_%H:%M:%S", time.localtime(d))
                log = 'LogFiles/flight_log_ac_{0}_{1}.tlog'.format(
                    ac, d_formated)
                with open(log, 'w') as f:
                    f.write('')
                mlog = mavutil.mavlink_connection(
                    log, dialect='ardupilotmega', baud=BAUD, write=True, append=True)
                mavutil.set_dialect("ardupilotmega")

                time.sleep(12)

                logger.info('IC {}: Loading parameters.'.format(ac))

            elif 'PLAYBACK' in m[0]:
                if 'START' in m[0]:
                    master = 'FILE'
                    log = m[0][4]

                    # check file exists
                    try:
                        f = open('LogFiles/'+log, 'r')
                    except Exception as e:
                        q.put(
                            '{"name":"IC_PLAYBACK", "INFO": "Playback error: File Not Found.'+str(e)+'", "ecode":"1"}')
                        return

                    logger.info('IC Playback: Opening File: {}'.format(log))
                    # get file type, tlog or mlog
                    if 'tlog' in log[-4:]:
                        global logplayer
                        logplayer = P.LogPlayer(log, 'tlog')
                        logger.info(
                            'IC Playback: Created Log Player {}'.format(logplayer))
                        logplayer.getMessages()
                        logger.info('IC Playback : {} {}'.format(
                            log, logplayer.total_messages))

                    elif 'mlog' in log[-4:]:
                        logplayer = P.LogPlayer(log, 'mlog')
                        logger.info(
                            'IC Playback : Created Log Player {}'.format(logplayer))
                        logplayer.getMessages()

                    else:
                        logger.warning(
                            'IC Playback: Playback error: Unknown file type. {}'.format(log[-4:]))
                        q.put(
                            '{"name":"IC_PLAYBACK", "INFO": "Playback error: Unknown file type.", "ecode":"2"}')
                        quit()

                elif 'PLAY' in m[0]:
                    logplayer.Play()

                elif 'SHUTDOWN' in m[0]:
                    q.put('{"AIRCRAFT":"PLAYBACK", "name":"SHUT_DOWN"}')
                    logger.info('IC Playback: Shutdown recieved')
                    logplayer = None
                    q.close()
                    master = 'END'

                elif 'REW' in m[0]:
                    logplayer.Rew()
                elif 'FF' in m[0]:
                    logplayer.FF()
                elif 'SKIP' in m[0]:
                    logplayer.SkipForward()

            # Remove the completed command from the list
            m.pop(0)
            logger.info('IC {0}: List {0}: {1}'.format(ac, str(m)))

        # if shutdown recieved exit the process
        if master == 'END':
            logger.info('IC {}: calling quit'.format(ac))
            quit()


# ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** * **
#
#  Messages from aircraft to frontend.
#
# ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** * **

def update_position(q, TM, master, mlog, forwarding):
    global wp_count
    global wp_list
    global ac
    global has_heartbeat
    global hitl
    global logplayer
    logger = logging.getLogger()
    global starttime_now
    TM.update_traffic()

    if has_heartbeat == False:
        if (ac == 'NONE'):
            id = '{"AIRCRAFT" : "' + str(ac) + '", "TYPE" : "CONNECTING"}'
        else:
            id = '{"AIRCRAFT" : ' + str(ac) + ', "TYPE" : "CONNECTING"}'
        time.sleep(.5)
        q.put(id)

    # Receive and filter messages from each aircraft
    if master != 'NONE':
        if master != 'FILE':
            ret = MF.recvAndLog(master, mlog, forwarding)
            msg = ret[0]
            percent = ret[1]
            missing = ret[2]
            write_to_file = True
            if int(time.time()-starttime_now) >= 1 and msg is not None:
                starttime_now = time.time()
                q.put('{"AIRCRAFT" : ' + str(ac) +
                      ', "TYPE" : "RADIO_QUALITY", "PERCENT":' + str(percent) + ', "MISSING": '+str(missing)+'}')
        else:
            write_to_file = False
            if logplayer is not None and not logplayer.paused:
                message = logplayer.getNext()
                stats = logplayer.getStats()

                p_update = '{ "name" : "LOGPLAYER", "CURRENT" : ' + \
                    str(stats[0])+', "TOTAL" : '+str(stats[1]) + \
                    ', "PERCENT" : '+str(stats[2])+' }'

                q.put(p_update)
                if len(message) > 0:
                    ac = str(message[0])
                    msg = message[1]
                else:
                    return
            else:
                return

        if write_to_file and msg is not None:
            with open('LogFiles/msg_in_{0}_{1}.txt'.format(da_formated, ac), 'a') as f:
                f.write('Aircraft: ' + str(ac) + '; ' + str(msg)+'\n')

        if msg is not None:
            # print(msg)
            if 'BAD_DATA' in str(msg):
                # print(msg)
                return
            if msg.name == "MISSION_COUNT":
                if msg.mission_type == 1:
                    if logplayer is not None:
                        v_count[ac] = msg.count
                        f_list[ac] = 0
                        # total number of verticies
                        gf_list[ac] = [0] * msg.count
                        logger.info('Vertex count:{}'.format(msg.count))

                    # if rando message appears here re-request points
                    else:
                        class Empty:
                            pass
                        msg_in = Empty()
                        msg_in.count = v_count[ac]
                        msg = CF.requestVert(
                            msg_in, ac, master, mlog, forwarding)
                        q.put(str(msg))
                elif msg.mission_type == 2:
                    r_count[ac] = msg.count
                    r_list[ac] = [0] * msg.count
                    logger.info('Replan count:{}'.format(msg.count))
                    # request points
                    if logplayer is None:
                        class Empty:
                            pass
                        msg_in = Empty()
                        msg_in.count = r_count[ac]
                        msg = CF.requestReplan(
                            msg_in, ac, master, mlog, forwarding)
                        q.put(str(msg))
                else:
                    wp_count[ac] = msg.count
                    wp_list[ac] = [0] * msg.count
                    logger.info('Mission count:{}'.format(msg.count))
                return

            elif msg.name == 'MISSION_ACK':
                return

            elif msg.name == 'MISSION_REQUEST':
                return

            elif msg.name == 'MISSION_ITEM_REACHED':
                print(msg)
                return

            elif msg.name == "MISSION_ITEM" or msg.name == 'MISSION_ITEM_INT':
                if logplayer is not None:

                    if ac not in wp_count:
                        return

                    if msg.mission_type == 2 and len(r_count) > 0:
                        if r_count[str(ac)] > 0:
                            r_list[str(ac)][int(msg.seq)] = msg
                            if int(msg.seq) == r_count[ac]-1:
                                msg = CF.sendReplan(r_list, ac)
                                q.put(msg)

                    elif msg.mission_type == 1 and len(gf_list[ac]) > 0:

                        f = int(msg.seq)  # fence number
                        numv = int(msg.param1)  # numv for this fence
                        thisv = int(msg.param2)  # id of this v in this fence

                        if v_count[ac] == 0:
                            v_count[ac] = numv
                        if f_list[ac] == 0:
                            f_list[f] = numv

                        # place this msg in the correct spot
                        n = 0
                        for i in range(f, 0, -1):
                            n = f_list[i-1] + n
                        n = n + thisv
                        gf_list[ac][n] = msg

                        # check if all messages have been recieved
                        if all(str(x) != '0' for x in gf_list[ac]):
                            #     # send the message
                            msg = CF.sendVert(gf_list, ac)
                            q.put(msg)

                    # need to catch not found error
                    elif (msg.mission_type == 0 or msg.mission_type == 255) and len(wp_count) > 0:
                        if wp_count[ac] > 0:
                            wp_list[str(ac)][msg.seq] = msg
                            if msg.seq == wp_count[ac]-1:
                                if 'MISSION_ITEM_INT' in str(msg):
                                    msg = CF.sendWaypointsInt(wp_list, ac)
                                else:
                                    msg = CF.sendWaypoints(wp_list, ac)
                                q.put(msg)
                return

            elif msg.name == "PARAM_VALUE":
                if str(msg.param_id) == 'STAT_RUNTIME':
                    return
                # elif logplayer is None:
                elif '"' not in msg.param_id:
                    msg.param_id = '"'+msg.param_id+'"'
                    # print(msg)

            elif msg.name == "STATUSTEXT":
                logger.info('IC {} : {}'.format(ac, msg))
                msg.text = '"'+msg.text+'"'

            elif msg.name == "ADSB_VEHICLE":
                # print(msg)
                # if msg.emitter_type == 255:
                #     TM.checkTrafficList(msg.ICAO_address)

                msg.name = "TRAFFIC"
                msg.TRAFFIC = msg.ICAO_address
                msg.TTYPE = 'ADSB'
                msg.LAT = msg.lat
                msg.LNG = msg.lon
                msg.VEL = msg.hor_velocity
                msg.HDG = msg.heading
                msg.ALT = msg.altitude
                msg.AC = ac
                msg.callsign = '"'+str(msg.callsign)+'"'
                msg.EMIT = msg.emitter_type

            elif msg.name == 'HEARTBEAT' or msg.name == 'GLOBAL_POSITION_INT':
                has_heartbeat = True

            # send the message to the front end
            m = ''
            for item in msg._fieldnames:
                m = m + ', "{}":{}'.format(item, msg.format_attr(item))

            id = '{"AIRCRAFT" : ' + str(ac) + ', "TYPE" : "' + \
                str(msg.name) + '"' + m + '}'
            # print('id', id)
            q.put(id)


# ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** * **
#
#  Messages from front end to aircraft.
#
# ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** * **

def completeCommands(q, msg, TM, master, mlog):
    global forwarding
    logger = logging.getLogger()
    if len(msg) > 0:
        # parse the message
        message = msg

        consumer_message = message[2:]

        if 'NEW_AIRCRAFT' in consumer_message:
            global ac
            ac = message[1]
            master, pidI, pidA = CF.requestNewAircraft(
                consumer_message, 57600, UDP_PORT_2, HOST)
            logger.info('IC {}: master: {} pidI: {} pidA: {}'.format(
                ac, master, pidI, pidA))
            ac_pids.append(pidI)
            ac_pids.append(pidA)

        elif 'HITL' in consumer_message:
            BAUD = consumer_message[3]
            IP = consumer_message[5]
            PORT = consumer_message[7]
            COMP = consumer_message[9]
            ac = consumer_message[1]

            if COMP != 'Default':
                MF.setTargetComponent(int(COMP))
            print('ic processes', COMP)

            master = CF.connectToHardwareIP(consumer_message, IP, PORT, BAUD)

            d = int(time.time())
            d_formated = time.strftime(
                "%Y-%m-%d_%H:%M:%S", time.localtime(d))
            log = 'LogFiles/flight_log_ac_{0}_{1}.tlog'.format(
                ac, d_formated)
            with open(log, 'w') as f:
                f.write('')
            mlog = mavutil.mavlink_connection(
                log, dialect='ardupilotmega', baud=BAUD, write=True, append=True)
            mavutil.set_dialect("ardupilotmega")

            global hitl
            hitl = True

            if master != 'NONE':
                logger.info('IC {}: master {}'.format(ac, master))
            else:
                logger.info('IC {0}: Connection Failed'.format(ac))
                q.put('{"name":"HITL", "INFO":"CONNECTION_FAILED"}')

        elif 'HITL_DISCONNECT' in consumer_message:
            global has_heartbeat
            has_heartbeat = True
            master.close()
            q.close()
            q.cancel_join_thread()
            master = 'END'

            logger.info('IC {0}: Disconnected'.format(ac))

        elif 'REQUEST_WAYPOINTS' in consumer_message:
            logger.info('')
            logger.info(
                '**************************************************************')
            msg_in = MF.requestCount(master, mlog, forwarding)

            if str(msg_in) != 'NONE':
                msg = CF.requestWaypoints(
                    msg_in, consumer_message[1], master, mlog, forwarding)
                q.put(str(msg))
            else:
                q.put(
                    '{"name":"WAYPOINT_REQUEST", "INFO":"FAIL. Message_Timeout_Reached"}')
                logger.info(
                    'WAYPOINT_REQUEST : FAIL : Message_Timeout_Reached')

            logger.info(
                '**************************************************************')
            logger.info('')

        elif 'REQUEST_FENCE' in consumer_message:
            logger.info('')
            logger.info(
                '**************************************************************')
            msg_in = MF.requestCountF(master, mlog, forwarding)

            if str(msg_in) != 'NONE':
                msg = CF.requestVert(
                    msg_in, consumer_message[1], master, mlog, forwarding)
                q.put(str(msg))
            else:
                q.put(
                    '{"name":"VERT_REQUEST", "INFO":"FAIL. Message_Timeout_Reached"}')
                logger.info(
                    'VERT_REQUEST : FAIL : Message_Timeout_Reached')

            logger.info(
                '**************************************************************')
            logger.info('')

        elif 'REQUEST_REPLAN' in consumer_message:
            logger.info('')
            logger.info(
                '**************************************************************')
            msg_in = MF.requestCountR(master, mlog, forwarding)

            if str(msg_in) != 'NONE':
                msg = CF.requestReplan(
                    msg_in, consumer_message[1], master, mlog, forwarding)
                q.put(str(msg))
            else:
                q.put(
                    '{"name":"WAYPOINT_REQUEST", "INFO":"FAIL. Message_Timeout_Reached"}')
                logger.info(
                    'WAYPOINT_REQUEST : FAIL : Message_Timeout_Reached')

            logger.info(
                '**************************************************************')
            logger.info('')

        elif 'ADSB_VEHICLE' in consumer_message:
            MF.sendTraffic(consumer_message, master)

        elif 'LOAD_FLIGHT_PLAN' in consumer_message:
            CF.loadFlightPlan(ac, consumer_message, q,
                              master, mlog, forwarding)

        elif 'FLIGHT_STARTED' in consumer_message:
            logger.info('IC {}: ConsumerMSG {}'.format(ac, consumer_message))
            aircraft = '{"AIRCRAFT" : '+consumer_message[-3]+', '
            icarous_flag = consumer_message[-1]
            launch = consumer_message[-2]
            logger.info('IC {}: Icarous Flag: {}'.format(ac, icarous_flag))
            MF.startFlight(icarous_flag, launch, master, mlog, forwarding)
            logger.info('IC {}: Flight Started'.format(ac))
            q.put(aircraft + '"TYPE":"STARTFLIGHT", "INFO": "SUCCESS"}')

        elif 'ADD_TRAFFIC' in consumer_message:
            message.append(master)
            TM.add_traffic(message)

        elif 'FILE_TRAFFIC' in consumer_message:
            t_id = consumer_message[1]

            # open the file
            dir = os.path.dirname(os.path.realpath(__file__))
            filename = consumer_message[2]
            path = dir + '/..' + filename

            # get the data
            with open(path) as f:
                line = f.readline()
                logger.info('IC {}: File Add Traffic {}'.format(ac, line))
                x = line.split(' ')
                message = ['AIRCRAFT', ac, 'ADD_TRAFFIC', t_id,
                           x[0], x[1], 0, 0, x[2], x[3], x[4], 0, x[5], master]
                TM.add_traffic(message)
            f.close()

        elif 'REMOVE_TRAFFIC' in consumer_message:
            TM.remove_traffic(consumer_message)

        elif 'LOAD_GEOFENCE' in consumer_message:
            CF.loadGeoFence(ac, consumer_message, q, master, mlog, forwarding)

        elif 'REMOVE_GEOFENCE' in consumer_message:
            #  Not really working, just replacing the fence with another fence with no points
            index = consumer_message[6]
            floor = 2
            roof = 100
            MF.removeGF(index, floor, roof, master)
            logger.info('IC {}: Fence Removed'.format(ac))

        elif 'SHUTDOWN' in consumer_message:
            master.close()
            q.close()
            CF.shutdownProcesses(ac_pids)
            master = 'END'

        elif 'RESET_ICAROUS' in consumer_message:
            MF.resetIcarous(master)

        elif 'UPDATE_PARAM_LIST' in consumer_message:
            print('Requesting Params')
            MF.fetchParams(master)
            logger.info('IC {}: trying to fetch params'.format(ac))

        elif 'CHANGE_PARAM' in consumer_message:
            logger.info('IC {}: trying to change params'.format(ac))
            MF.changeParamFloat(consumer_message, master, mlog, forwarding)
            q.put('{"name":"CHANGE_PARAM", "INFO": "SUCCESS. ' +
                  str(consumer_message)+'"}')
            logger.info('IC {}: Change Params Success.'.format(ac))

        elif 'LOAD_WP_FILE' in consumer_message:
            CF.loadFlightPlanFile(ac, consumer_message, q, master, mlog)

        elif 'LOAD_GF_FILE' in consumer_message:
            CF.loadGeoFenceFile(ac, consumer_message, q, master, mlog)

        elif 'LOAD_PARAM_FILE' in consumer_message:
            CF.loadParamFile(ac, consumer_message, q, master, mlog)

        elif 'SAVE' in consumer_message:
            CF.saveFile(ac, consumer_message, q, master, mlog)

        elif 'RADAR' in consumer_message:
            # ['RADAR', '1']
            logger.info('IC {}: Sending Radar Command:'.format(
                ac), consumer_message)
            MF.sendUser3(consumer_message[1], master)

        elif 'FORWARD' in consumer_message:
            if consumer_message[1] == 'STOP':
                forwarding.close()
                forwarding = None
            else:
                device = 'udp:' + consumer_message[1]+':'+consumer_message[2]
                baud = consumer_message[3]
                print(device, baud)
                forwarding = mavutil.mavlink_connection(
                    device, baud=baud, input=False, dialect='ardupilotmega')
        # else:
        #     print('UNKNOWN MESSAGE: ', consumer_message)

    return master, mlog
