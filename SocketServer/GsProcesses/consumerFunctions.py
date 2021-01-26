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

import subprocess
import psutil
import signal
import os
import sys
import logging
import json

from pymavlink import mavutil, mavwp, mavparm
from multiprocessing import Process
import GsProcesses.mavlinkCommands as MF
import GsProcesses.gfManager as GF
import GsProcesses.checkIcConfig as CC


def requestNewAircraft(msg, BAUD, UDP_PORT_2, HOST):
    logger = logging.getLogger()
    v = 'ArduCopter'  #version
    l = ''.join([x+',' for x in msg[2:6]])[0:-1] #lat,lng,alt,hdg
    s = '1' #speed Arducoper only
    i = str(int(msg[1]) - 1) #instance
    c = '1' #cpu number
    port = UDP_PORT_2 + 10 * (int(i) + (int(c)-1)*4) #port to connect to icarous on
    icarous_flag = msg[6] #icarous on=1 or off=0
    sim_type = msg[7] #sim type
    p = msg[8] #path to icarous
    a = msg[9] #path to arducopter
    if icarous_flag == '0':
        port = port - 3 #connect directly to arducopter
    m = '{}:{}'.format(HOST,port)

    CC.update_cfg_files(int(i), os.path.expanduser('~')+p)

    pidA = 0
    if sim_type == 'ArduCopter':
        logger.info("StartAutopilot.sh -v  {} -l {} -s {} -i {} -m {} -p {}".format(v,l,s,i,m,a))
        pidA = subprocess.Popen(["{}/Scripts/StartAutopilot.sh".format(os.environ.get('WEBGS_HOME')),
                                 "-v", v, "-l", l, "-s", s, "-i", i, "-m", m, '-p', a]).pid
        logger.info('Ardupilot running on pid: {}'.format(pidA))

    # start icarous
    pidI = 0
    if icarous_flag == '1':
        print(msg)
        print('cpu {}, instance {}, port,{}'.format(c,i,port))
        logger.info('Start Icarous: Scripts/StartIcarous.sh -C {} -I {} -P {}'.format(c,i,p))

        pidI = subprocess.Popen(["{}/Scripts/StartIcarous.sh".format(os.environ.get('WEBGS_HOME')),
                                 '-C', c, '-I', i, '-P', p]).pid

        logger.info('Icarous running on pid: {}'.format(pidI))

    # Open a mavlink UDP port
    try:
        mas = mavutil.mavlink_connection('udp:{}'.format(m), dialect='ardupilotmega', baud=BAUD, append=True)

        MF.requestDataStream(BAUD, mas)
        logger.info('Connected on port: {}'.format(port))

    except Exception:
        logger.exception("Error opening mavlink connection", exc_info=True)
        mas = None

    return mas, pidI, pidA



def connectToHardwareIP(msg, IP, PORT, BAUD):
    logger = logging.getLogger()
    ac = msg[1]
    address = 'udp:{}:{}'.format(IP,PORT)
    serial = '{},{}'.format(IP,BAUD)
    try:
        if msg[4] == 'IP':
            print(address)
            m = mavutil.mavlink_connection(address, dialect='ardupilotmega', force_connected=True)
            logger.info('IC {}: {} {}'.format(ac, BAUD, m))
        else:
            print(serial)
            m = mavutil.mavlink_connection(serial, dialect='ardupilotmega')
            logger.info('{} {}'.format(BAUD, m))

        MF.requestDataStream(int(msg[3]), m)
        logger.info('IC {}: Connected on: {}'.format(ac, address))

    except Exception as ecpt:
        print(ecpt)
        logger.exception("IC {0}: Error opening mavlink connection".format(ac), exc_info=True)
        logger.info(ecpt)
        m = 'NONE'

    return m


def shutdownProcesses(pid_list):
    logger = logging.getLogger()
    # pid_list = [icarous start script pid, ardupilot start script pid]
    if pid_list[1] != 0:
        logger.info('Killing mavproxy')
        subprocess.Popen(['pkill', '-f', 'python sim_vehicle.py']).wait(5)
        subprocess.Popen(
            ['pkill', '-f', '/usr/bin/python /usr/local/bin/mavproxy.py']).wait(5)
        subprocess.Popen(['pkill', '-15', 'mavproxy.py']).wait(5)

        logger.info('Killing Xterm')
        subprocess.Popen(["pkill", '-15', "xterm"]).wait(5)

        subprocess.Popen(
            ['pkill', '-f', 'Scripts/StartAutopilot.sh']).wait(5)

    if pid_list[0] != 0:
        logger.info('Killing Icarous on pid: {}'.format(pid_list[0]))

        try:
            logger.info('Pid List: {}'.format(pid_list))
            parent = psutil.Process(pid_list[0])
            logger.info('Parent: {}'.format(parent))
        except psutil.NoSuchProcess:
            logger.info('Process not found.')
            return

        children = parent.children(recursive=True)

        for child in children:
            child.send_signal(signal.SIGINT)
            logger.info('Cleaning up /dev/mqueue. pid {0}'.format(child.pid))
            subprocess.Popen(
                ['./Scripts/clearMqueue.sh', '-P', str(child.pid)])

    logger.info('Shutdown complete.')


def requestWaypoints(msg_in, ac, m, mlog, forwarding):
    logger = logging.getLogger()
    logger.info('IC {}: Mission Count {}'.format(ac, msg_in))
    has_next = False
    if msg_in is None:
        print('Failed to recieve mission count, WP.')
        return '"None"'
    if int(msg_in.count) > 0:
        has_next = True
    i = 0
    msg_list = []
    vel = 0
    while has_next:
        msg_item = MF.requestWaypoints(i, m, mlog, forwarding)

        if msg_item is not None and msg_item.seq == i:
            logger.info('IC {}: {}'.format(ac, msg_item))
            msg_part = '{ "SEQ":' + str(msg_item.seq) + \
                ', "LAT":' + str(msg_item.x) + \
                ', "LNG":' + str(msg_item.y) + \
                ', "ALT":' + str(msg_item.z) + '}'
            if msg_item.command == 178:
                vel = msg_item.param2

            msg_list.append(msg_part)
            i += 1
            if i >= msg_in.count:
                has_next = False
        else:
            logger.info('mission item {} {}'.format(i, msg_item))

    msg = '{"AIRCRAFT":' + ac + ','+ '"TYPE":"WP", "LIST":['
    msg = msg + (', ').join(msg_list) + '], "VEL":' + str(vel) + ', "FILE":"false"}'

    return msg


def requestVert(msg_in, ac, m, mlog, forwarding):
    # msg_item
    # seq = fence number (zero based)
    # frame = type (in or ex)
    # param 1 = numV
    # param 2 = current vert (zero based)
    # param 3 = floor
    # param 4 = roof
    # x = lat
    # y = lng

    # out for each fence
    # Geofence = {"id": id, "type": t, "numV": numV, "floor": floor,
    #                     "roof": roof, "Vertices": Vertices}
    logger = logging.getLogger()
    logger.info('IC {}: Mission Count {}'.format(ac, msg_in))
    has_next = False
    if msg_in is None:
        print('Failed to recieve mission count, GF.')
        return '"None"'
    if int(msg_in.count) > 0:
        has_next = True
    i = 0  # point count total
    v_list =[]
    f_list = []
    p_id = 0 # point id per fence
    f_id = 0 # fence id
    fence = {}
    while has_next:
        msg_item = MF.requestVert(i, m, mlog, forwarding)
        if msg_item is not None and msg_item.mission_type != 1:
            msg = '{"AIRCRAFT" : ' + ac + ', "TYPE":"GF", "LIST":[ ], "FILE" : "False"}'
            return msg
        if msg_item is not None and msg_item.param2 == p_id:
            if f_id == msg_item.seq:
                logger.info('IC {}: {}'.format(ac, msg_item))
                v_list.append((msg_item.x, msg_item.y))
                fence = {"id": msg_item.seq +1,
                         "type":  msg_item.frame,
                         "numV":  msg_item.param1,
                         "floor":  msg_item.param3,
                         "roof":  msg_item.param4,
                         "Vertices":  v_list}
                p_id +=1
            i += 1
            if i >= msg_in.count:
                f_list.append(fence)
                has_next = False
        elif msg_item is not None:
            f_id +=1
            p_id = 0
            f_list.append(fence)
            fence = []
            v_list = []
            logger.info('mission item {} {}'.format(i, msg_item))

    logger.info('IC {}: Fence List: {}'.format(ac, f_list))

    msg = '{"AIRCRAFT" : ' + ac + ', "TYPE":"GF", "LIST":['
    if len(f_list) >= 1:
        for item in f_list:
            m = json.dumps(item)
            msg = msg + m +','
    else:
        msg = msg +' ,'
    msg = msg[:-1] + '], "FILE" : "False"}'
    return msg

def requestReplan(msg_in, ac, m, mlog, forwarding):
    logger = logging.getLogger()
    logger.info('IC {}: Mission Count {}'.format(ac, msg_in))
    has_next = False
    if msg_in is None:
        print('Failed to recieve mission count, RP.')
        return '"None"'
    if int(msg_in.count) > 0:
        has_next = True
    i = 0
    msg_list = []
    vel = 0
    while has_next:
        msg_item = MF.requestReplan(i, m, mlog, forwarding)

        if msg_item is not None and msg_item.seq == i:
            logger.info('IC {}: {}'.format(ac, msg_item))
            msg_part = '{ "SEQ":' + str(msg_item.seq) + \
                ', "LAT":' + str(msg_item.x) + \
                ', "LNG":' + str(msg_item.y) + \
                ', "ALT":' + str(msg_item.z) + '}'
            if msg_item.command == 178:
                vel = msg_item.param2

            msg_list.append(msg_part)
            i += 1
            if i >= msg_in.count:
                has_next = False
        else:
            logger.info('mission item {} {}'.format(i, msg_item))

    msg = '{"AIRCRAFT":' + ac + ','+ '"TYPE":"REPLAN", "LIST":['
    msg = msg + (', ').join(msg_list) + '], "VEL":' + str(vel) + ', "FILE":"false"}'

    return msg


def sendVert(msg_in, ac):
    i = 0
    v_list =[]
    f_list = []
    vid = 0
    f_id = 0
    print(msg_in)
    for msg_item in msg_in[ac]:
        if msg_item.param2 != vid:
            f_id +=1
            vid = 0
            f_list.append(fence)
            fence = []
            v_list = []

        if f_id == msg_item.seq:
            v_list.append((msg_item.x, msg_item.y))
            fence = {"id": msg_item.seq +1,
                        "type":  msg_item.frame,
                        "numV":  msg_item.param1,
                        "floor":  msg_item.param3,
                        "roof":  msg_item.param4,
                        "Vertices":  v_list}
            vid +=1
        i += 1
        if i >= len(msg_in[ac]):
            f_list.append(fence)


    msg = '{"AIRCRAFT" : ' + ac + ', "TYPE":"GF", "LIST":['

    if len(f_list) >= 1:
        for item in f_list:
            m = json.dumps(item)
            msg = msg + m +','
    else:
        msg = msg + ' ,'
    msg = msg[:-1] + '], "FILE" : "False"}'
    print(msg)
    return msg

def sendReplan(r_list, ac):
    logger = logging.getLogger()
    msg_list = []
    vel = 0
    count = 0
    for msg_item in r_list[ac]:
        logger.info('IC {}: {}'.format(ac, str(msg_item)))

        msg_part = '{ "SEQ":' + str(count) + \
            ', "LAT":' + str(msg_item.x) + \
            ', "LNG":' + str(msg_item.y) + \
            ', "ALT":' + str(msg_item.z) + '}'
        logger.info('{}'.format(msg_part))
        msg_list.append(msg_part)
        count += 1

    msg = '{"AIRCRAFT":' + ac + ','+ '"TYPE":"REPLAN", "LIST":['
    msg = msg + (', ').join(msg_list) + '], "VEL":' + str(vel) + ', "FILE":"false"}'

    return msg


def sendWaypointsInt(wp_list, ac):
    logger = logging.getLogger()
    msg_list = []
    vel = 0

    count = 0
    for msg_item in wp_list[ac]:

        logger.info('IC {}: {}'.format(ac, msg_item))

        if msg_item.command == 16:
            msg_part = '{ "SEQ":' + str(count) + \
                ', "LAT":' + str(msg_item.x/1e7) + \
                ', "LNG":' + str(msg_item.y/1e7) + \
                ', "ALT":' + str(msg_item.z) + '}'
            logger.info('{}'.format(msg_part))
            msg_list.append(msg_part)
            count += 1
        if msg_item.command == 178:
            # do change vel
            vel = msg_item.param2
        if msg_item.command == 177:
            # do jump (repeat mission items, no need to send to front end for now)
            logger.info('Ignore do jump command.')
            # get repeat seq num
            num = int(msg_item.param1)
            # add this one back in as last wp to close the loop
            msg_part = '{ "SEQ":' + count + \
                ', "LAT":' + wp_list[ac][num].x/1e7 + \
                ', "LNG":' + wp_list[ac][num].y/1e7 + \
                ', "ALT":' + wp_list[ac][num].z + '}'
            logger.info('{}'.format(msg_part))
            msg_list.append(msg_part)
            count += 1
        if msg_item.command == 20:
            # return to home pos after complete, after a do jump
            logger.info('Ignore return to home after do jump.')
    msg = '{"AIRCRAFT":' + ac + ','+ '"TYPE":"WP", "LIST":['
    msg = msg + (', ').join(msg_list) + '], "VEL":' + str(vel) + ', "FILE":"false"}'

    return msg


def sendWaypoints(wp_list, ac):
    logger = logging.getLogger()
    msg_list = []
    vel = 0
    count = 0
    for msg_item in wp_list[ac]:
        logger.info('IC {}: {}'.format(ac, str(msg_item)))

        if 'MISSION_ITEM' not in str(msg_item):
            print(wp_list)
        elif msg_item.command == 16:
            msg_part = '{ "SEQ":' + str(count) + \
                ', "LAT":' + str(msg_item.x) + \
                ', "LNG":' + str(msg_item.y) + \
                ', "ALT":' + str(msg_item.z) + '}'
            logger.info('{}'.format(msg_part))
            msg_list.append(msg_part)
            count += 1
        elif msg_item.command == 178:
            # do change vel
            vel = msg_item.param2
        elif msg_item.command == 177:
            # do jump (repeat mission items, no need to send to front end for now)
            logger.info('Ignore do jump command.')
            # get repeat seq num
            num = int(msg_item.param1)
            # add this one back in as last wp to draw
            msg_part = '{ "SEQ":' + count + \
                ', "LAT":' + str(wp_list[ac][num].x) + \
                ', "LNG":' + str(wp_list[ac][num].y) + \
                ', "ALT":' + str(wp_list[ac][num].z) + '}'
            logger.info('{}'.format(msg_part))
            logger.info('{}'.format(msg_part))
            msg_list.append(msg_part)
            count += 1
        elif msg_item.command == 20:
            # return to home pos after complete, after a do jump
            logger.info('Ignore return to home after do jump.')

    msg = '{"AIRCRAFT":' + ac + ','+ '"TYPE":"WP", "LIST":['
    msg = msg + (', ').join(msg_list) + '], "VEL":' + str(vel) + ', "FILE":"false"}'

    return msg


def loadFlightPlan(ac, consumer_message, q, master, mlog, forwarding):
    logger = logging.getLogger()
    logger.info('')
    logger.info('*******************************************************')
    logger.info('IC {}: {}'.format(ac, consumer_message))

    aircraft = '{"AIRCRAFT": ' + consumer_message[2]+', '
    q.put(aircraft + '"TYPE":"WAYPOINTLOAD", "INFO":"START"}')

    # Format the message
    consumer_message = consumer_message[:-1]
    lats = consumer_message[7::3]
    lngs = consumer_message[8::3]
    alts = consumer_message[9::3]
    sim_type = consumer_message[6]
    wp_list = list(zip(lats, lngs, alts))

    # Let the system know how many wp's to expect
    msg_in = MF.sendMissionCount(wp_list, master, mlog, forwarding)
    logger.info('IC {}: send mission count'.format(ac))
    q.put(aircraft + '"TYPE" : "WAYPOINTLOAD", "INFO" : "SEND MISSION COUNT"}')

    # Send the wp's
    radius = 10
    seq = 0

    if msg_in is'NONE' or msg_in is None:
        logger.info(
            'IC {}: Timeout Reached. Waypoint Load Failed'.format(ac))
        q.put(aircraft + '"TYPE" : "WAYPOINTLOAD", "INFO" : "LOAD FAILED TIMEOUT REACHED"}')

    else:
        logger.info('IC {}: message in {}'.format(ac, msg_in))

        # set home location to first point
        MF.setHome(wp_list[int(msg_in.seq)], master, mlog, forwarding)

        # Send start point
        msg_in = MF.sendWaypoint(wp_list[int(msg_in.seq)], radius, int(msg_in.seq), master, mlog, forwarding)
        logger.info('IC {}: Point sent: {}'.format(ac, wp_list[0]))
        logger.info('IC {}: Message In: {}'.format(ac, msg_in))

        msg_in = MF.sendVelocity(
            float(consumer_message[4]), master, mlog, forwarding)
        logger.info('IC {}: Velocity sent: {}'.format(
            ac, consumer_message[4]))
        logger.info('IC {}: Message In: {}'.format(ac, msg_in))
        print(wp_list)
        # Send the Waypoints
        while True:
            if msg_in is'NONE' or msg_in is None:
                logger.info(
                    'IC {}: Timeout Reached. Waypoint Load Failed'.format(ac))
                q.put(aircraft + '"TYPE" : "WAYPOINTLOAD", "INFO" : "LOAD FAILED TIMEOUT REACHED"}')
                return
            elif str(msg_in).find('MISSION_ACK') == 0:
                logger.info('IC {}: message in {}'.format(ac, msg_in))
                if int(msg_in.type) != 0:
                    logger.info(
                        'IC {}: End load wp. Mission Load Failed'.format(ac))
                    q.put(aircraft + '"TYPE" : "WAYPOINTLOAD", "INFO" : "LOAD FAILED TIMEOUT REACHED"}')
                else:
                    logger.info('IC {}: End load wp.'.format(ac))
                    q.put(aircraft + '"TYPE" : "WAYPOINTLOAD", "INFO" : "SUCCESS"}')
                break
            else:

                seq = int(msg_in.seq)
                print(seq, wp_list[seq-1])
                item = wp_list[seq-1]
                logger.info('IC {0}: Sending waypoint {1}, {2}'.format(ac, item, [
                    float(item[0]),
                    float(item[1]),
                    float(item[2]),
                    mavutil.mavlink.MAV_MISSION_TYPE_ALL,
                    master]))

                msg_in = MF.sendWaypoint(
                    item, radius, seq, master, mlog, forwarding)
                logger.info('IC {}: Point sent: {}'.format(
                    ac, item))

                q.put(
                    aircraft + '"TYPE" : "WAYPOINTLOAD", "INFO" : "SENT WAYPOINT '+str(seq)+'"}')

    logger.info('*******************************************************')
    logger.info('')


def loadFlightPlanFile(ac, consumer_message, q, master, mlog):
    try:
        logger = logging.getLogger()
        wpload = mavwp.MAVWPLoader(
            master.target_system, master.target_component)
        dir = os.path.dirname(os.path.realpath(__file__))
        num = wpload.load(
            dir + '/../../Examples/FlightPlans/'+consumer_message[1])
        msg_list = []
        vel = 0
        for i in range(0, num):
            msg_item = wpload.wp(i)
            if msg_item.command == 16 or msg_item.command == 22:
                msg_part = '{ "SEQ":' + str(msg_item.seq) + \
                    ', "LAT":' + str(msg_item.x) + \
                    ', "LNG":' + str(msg_item.y) + \
                    ', "ALT":' + str(msg_item.z) + '}'
                msg_list.append(msg_part)
            elif msg_item.command == 178:
                vel = msg_item.param2

        msg = '{"AIRCRAFT":' + ac + ','+ '"TYPE":"WP", "LIST":['
        msg = msg + (', ').join(msg_list) + '], "VEL":' + str(vel) + ', "FILE":"true"}'


        q.put(msg)
        q.put('{"AIRCRAFT":'+ac+', "name":"LOAD" , "INFO":"SUCCESS", "MSG":"LOAD WP FILE"}')
    except Exception as e:
        q.put('{"AIRCRAFT":'+ac+', "name":"LOAD" , "INFO":"FAIL", "MSG":"'+str(e)+'"}')

def loadGeoFence(ac, consumer_message, q, master, mlog, forwarding):
    logger = logging.getLogger()
    logger.info('')
    logger.info('*******************************************************')
    logger.info('IC {}: ConsumerMSG {}'.format(ac, consumer_message))

    aircraft = '{"AIRCRAFT" : ' + ac + ', '
    # Format the message
    lats = consumer_message[11::2]
    lngs = consumer_message[12::2]
    wp_list = list(zip(lats, lngs))

    # this matters, if you don't start at zero icarous will crash
    index = int(consumer_message[4]) - 1
    floor = int(consumer_message[8])
    roof = int(consumer_message[10])
    total = len(wp_list)
    f_type = consumer_message[6]

    q.put(aircraft + '"TYPE" : "GEOFENCELOAD", "INFO" : "START"}')
    msg_in = MF.sendGFEnable(index, f_type, total,
                             floor, roof, master, mlog, forwarding)

    # send points
    while True:
        logger.info('IC {}: message in {}'.format(ac, str(msg_in)))
        if msg_in is'NONE' or msg_in is None:
            logger.info('Timeout Reached. Point Load Failed')
            q.put(aircraft + '"TYPE" : "GEOFENCELOAD", "INFO" : "FAIL"}')
            break

        elif str(msg_in).find('COMMAND_ACK') == 0:
            logger.info('IC {}: message in {}'.format(ac, msg_in))
            logger.info('IC {}: End load Geofence.'.format(ac))
            q.put(aircraft + '"TYPE" : "GEOFENCELOAD", "INFO" : "SUCCESS"}')
            break

        else:
            seq = int(msg_in.idx)
            logger.info('IC {}: message in, idx {}'.format(ac, msg_in.idx))
            item = wp_list[seq]
            # Send the point
            logger.info('IC {0}: Sending point {1}, {2}'.format(ac, item, [master.target_system,
                                                                     master.target_component,
                                                                     seq,
                                                                     total,
                                                                     float(
                                                                         item[0]),
                                                                     float(
                                                                         item[1])
                                                                     ]))
            msg_in = MF.sendGFPoint(seq, total, item, master, mlog, forwarding)
    logger.info('IC {}: msg_in {}'.format(ac, msg_in))
    logger.info('*******************************************************')
    logger.info('')


def loadGeoFenceFile(ac, consumer_message, q, master, mlog):
    logger = logging.getLogger()
    dir = os.path.dirname(os.path.realpath(__file__))
    filename = dir + '/../../Examples/GeoFences/' + \
        consumer_message[1]
    try:
        # Make sure the file exists
        f = open(filename, 'r')
        f.close()
    except Exception as e:
        print('File not found. ', dir +'/../..' + consumer_message[1])
        q.put('{"name" : "LOAD", "INFO" : "FAIL", "MSG":"' + str(e) +'"}')
        return
    fencelist = GF.read_geofence(filename)
    logger.info('IC {}: Fence List: {}'.format(ac, fencelist))

    msg = '{"AIRCRAFT" : ' + ac + ', "TYPE":"GF", "LIST":['
    for item in fencelist:
        m = json.dumps(item)
        msg = msg + m +','

    q.put(msg[:-1] + '], "FILE" : "True"}')
    q.put('{"name" : "LOAD", "INFO" : "SUCCESS ", "MSG":"' + consumer_message[1]+'"}')


def loadParamFile(ac, consumer_message, q, master, mlog):
    logger = logging.getLogger()
    dir = os.path.dirname(os.path.realpath(__file__))
    try:
        f = open(dir + '/../..' + consumer_message[1], 'r')
    except Exception as e:
        print('File not found. ', dir +'/../..' + consumer_message[1])
        q.put('{"name" : "LOAD", "INFO" : "FAIL", "MSG":"' + str(e) +'"}')
        return

    retry = 3
    fail_list = []
    for line in f:
        if '#' not in line:
            words = line.split()
            if len(words) == 2:
                count = 0
                while count < retry:
                    master.mav.param_set_send(master.target_system,
                                            master.target_component,
                                            words[0].encode('utf8'),
                                            float(words[1]),
                                            mavutil.mavlink.MAV_PARAM_TYPE_REAL32)
                    msg_in = master.recv_match(type='PARAM_VALUE',
                                            blocking=True, timeout=.5)

                    if msg_in != None:
                        break
                    else:
                        count += 1
                    if count >= 3:
                        fail_list.append(words)

    f.close()

    logger.info('IC {0}: Unable to load {1} parameters: {2}'.format(
        ac, len(fail_list), str(fail_list)))
    q.put('{"name" : "LOAD", "INFO" : "SUCCESS", "MSG":"' + consumer_message[1]+'"}')
    return

def saveFile(ac, consumer_message, q, master, mlog):
    logger = logging.getLogger()
    dir = os.path.dirname(os.path.realpath(__file__))
    filename = consumer_message[2]
    path = dir + '/../..' + filename

    if consumer_message[1] == 'PARAM':
        try:
            f = open(path, 'w')
            # convert message from JSON string to list of objects
            data = consumer_message[3]
            loaded_data = json.loads(data)
            for item in loaded_data:

                # add proper spacing 16, 1, num.000000
                name = item['name']
                x = len(name)
                name = name + (' ' * (16 - x))
                value = float(item['value'])
                line = '{0} {1:7.6f}\n'.format(name, value)

                # write line
                f.write(line)

            f.close()
            q.put('{"name" : "SAVE", "INFO" : "SUCCESS", "MSG":"' + filename+'"}')
        except:
            q.put('{"name" : "SAVE", "INFO" : "FAIL", "MSG":"' + str(sys.exc_info()[0])+'"}')

    elif consumer_message[1] == 'WAYPOINTS':
        try:
            f = open(path, 'w')

            # convert message from list into component parts
            data = consumer_message[3:]
            vel = data[1]
            wp_list = data[3:-1]

            # add the header
            line = 'QGC WPL 110\n'
            f.write(line)

            # add the body
            for x in range(int(len(wp_list)/3)):
                if x == 0:
                    line = '{0}	0	0	16	0.000000	0.000000	0.000000	0.000000	{1}	{2}	{3}	1\n'.format(
                        x, wp_list[3*x], wp_list[3*x+1], wp_list[3*x+2])
                    line = line + '{0}	0	0	178	0.000000	{1}	0.000000	0.000000	0.000000	0.000000	0.000000	1\n'.format(
                        x+1, vel)
                else:
                    line = '{0}	0	0	16	0.000000	0.000000	0.000000	0.000000	{1}	{2}	{3}	1\n'.format(
                        x+1, wp_list[3*x], wp_list[3*x+1], wp_list[3*x+2])

                # write line
                f.write(line)

            f.close()

            q.put('{"name" : "SAVE", "INFO" : "SUCCESS", "MSG":"' + filename+'"}')
            logger.info('WP\'s saved to {0}'.format(path))
        except:
            q.put('{"name" : "SAVE", "INFO" : "FAIL", "MSG":"' +
                  str(sys.exc_info()[0])+'"}')
            logger.info('SAVE_WAYPOINTS : FAIL, "INFO":"' +
                  filename + ' ' + str(sys.exc_info()[0]))

    elif consumer_message[1] == 'GEOFENCE':
        try:
            data = {'id': consumer_message[3],
                    'type': consumer_message[4],
                    'numV': consumer_message[5],
                    'floor': consumer_message[6],
                    'roof': consumer_message[7],
                    'Vertices': {}
                    }
            vert = consumer_message[8:]
            for i in range(int(len(vert)/3)):
                data['Vertices'][int(vert[(i*3)])] = {
                    'lat': vert[(i*3)+1],
                    'lon': vert[(i*3)+2]
                }

            GF.save_geofence([data], path)
            q.put('{"name" : "SAVE", "INFO" : "SUCCESS", "MSG":"' + filename+'"}')
        except:
            print(str(sys.exc_info()[0]))
            q.put('{"name" : "SAVE", "INFO" : "FAIL", "MSG":"' + str(sys.exc_info()[0])+'"}')

    elif consumer_message[1] == 'SCRIPT':
        try:
            logger.info(consumer_message)
            logger.info('script not working yet')
            # f = open(path, 'w')

            # # convert message from list into component parts
            # data = consumer_message[3:]

            # # add the header
            # line = 'QGC WPL 110\n'
            # f.write(line)

            # f.close()
            q.put('{"name" : "SAVE", "INFO" : "SUCCESS", "MSG":"' + filename+'"}')
        except:
            q.put('{"name" : "SAVE", "INFO" : "FAIL", "MSG":"' + str(sys.exc_info()[0])+'"}')

    elif consumer_message[1] == 'TRAFFIC':
        try:
            f = open(path, 'w')

            # convert message from list into component parts
            data = consumer_message[3:]
            lat = data[0]
            lng = data[1]
            alt = data[2]
            vel = data[3]
            hdg = data[4]
            emit = data[5]
            # write the line
            line = "{0} {1} {2} {3} {4} {5}\n".format(
                lat, lng, alt, vel, hdg, emit)
            f.write(line)

            f.close()
            q.put('{"name" : "SAVE", "INFO" : "SUCCESS", "MSG":"' + filename +'"}')
        except:
            q.put('{"name" : "SAVE", "INFO" : "FAIL", "MSG":"' + str(sys.exc_info()[0])+'"}')
