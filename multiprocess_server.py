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

from multiprocessing import Process, Queue, Manager
import multiprocessing
import asyncio
import websockets
import os
import functools
import signal
import time
import logging
import json
import subprocess

import ServerFiles.icProcesses as ICP
import ServerFiles.userControl as UC
import ServerFiles.userManager as UM

q = Queue()
playback = False
path_icarous = ''


def to_ic(q, m):
    # all of the icarous stuff
    ICP.data(q, m)


def addProcess(target, args):
    p = Process(target=target, args=(args))
    return p


async def consumer_handler(websocket, path):
    global q
    global playback
    global path_icarous
    logger = logging.getLogger()

    while True:
        message = await websocket.recv()
        logger.info('SERVER: Input Message: ' + str(message))
        # parse the message
        message = message.split(' ')
        # print(message)
        # look for message to start new instance of icaorus
        if 'NEW_AIRCRAFT' in message:
            ac = int(message[3])
            user = um.getUser(websocket)
            user.addUserAircraft(ac)
            m = manager.list([message])
            p = addProcess(to_ic, (q, m))
            m_lists.append([ac, m])
            processes.append([ac, p])
            p.start()
            logger.info('SERVER: Starting New Aircraft {}'.format(processes))

        elif 'SHUTDOWN' in message:
            logger.info('SERVER: Active children: {}'.format(
                        multiprocessing.active_children()))
            if playback:
                playback = False
            # get the ac
            ac = int(message[3])
            print('SHUT_DOWN function', message)
            q.put('{"AIRCRAFT":'+str(ac)+', "name":"SHUT_DOWN"}')
            # get the list to add it to
            m = [x[1] for x in m_lists if x[0] == ac]
            if (len(m) > 0):
                m_lists.remove([x for x in m_lists if x[0] == ac][0])
                m1 = m[0]
                m1.append(message)
                # find the process
                p = [x for x in processes if x[0] == ac]
                processes.remove(p[0])
                p = p[0][1]
                p.join(timeout=5)
                logger.info('SERVER: Process exit code:{}'.format(p.exitcode))
                if p.exitcode == None:
                    p.terminate()
                    q.close()
                    q.join_thread()
                    q = Queue()

                # remove the list
                del m
                logger.info('SERVER: Active children: {}'.format(
                            multiprocessing.active_children()))

        elif 'CHECK_PATH' in message:
            complete_path = os.path.join(
                os.path.expanduser('~'), message[1][1:], 'exe/cpu1/core-cpu1')
            print(complete_path)

            try:
                f = open(complete_path, 'r')
                print('valid')
                q.put(
                    '{"name":"PATH_ICAROUS", "type":"PASS", "I":"VALID PATH"}')
                path_icarous = complete_path
            except Exception as e:
                print('check path error', e)
                q.put(
                    '{"name":"PATH_ICAROUS", "type":"FAIL", "I":"INVALID PATH:"}')

        elif 'CHECK_PATH_A' in message:
            complete_path = os.path.join(
                os.path.expanduser('~'), message[1][1:], 'Tools/autotest/sim_vehicle.py')
            print(complete_path)
            try:
                f = open(complete_path, 'r')
                print('valid')
                q.put(
                    '{"name":"PATH_ARDUPILOT", "type":"PASS", "I":"VALID PATH"}')
            except Exception as e:
                print('check path error', e)
                q.put(
                    '{"name":"PATH_ARDUPILOT", "type":"FAIL", "I":"INVALID PATH:"}')

        elif 'AIRCRAFT' in message:
            if message[1] != 'None' and not playback:

                if 'HITL_DISCONNECT' in message:

                    ac = int(message[3])
                    print('HITL_DISCONNECT function', message)
                    q.put('{"AIRCRAFT":'+message[3]+', "name":"SHUT_DOWN"}')
                    # get the list to add it to
                    m = [x[1] for x in m_lists if x[0] == ac]
                    try:
                        m_lists.remove([x for x in m_lists if x[0] == ac][0])
                    except IndexError:
                        print('HITL Disconnect Error')
                        logger.error(
                            'SERVER: AC not found in list. Unable to shut down.', exc_info=True)
                        pass
                    m1 = m[0]
                    m1.append(message)
                    # find the process and remove it
                    p = [x for x in processes if x[0] == ac]
                    processes.remove(p[0])
                    p = p[0][1]

                    # give icarous time to shut down
                    time.sleep(2)
                    p.join(timeout=5)
                    logger.info(
                        'SERVER: Process exit code:{}'.format(p.exitcode))
                    if p.exitcode == None:
                        p.terminate()
                        q.close()
                        q.join_thread()
                        q = Queue()
                    del m
                    logger.info('SERVER: Active children: {}'.format(
                                multiprocessing.active_children()))

                else:
                    ac = int(message[1])
                    # get the list to add it to
                    m = [x[1] for x in m_lists if x[0] == ac]
                    try:
                        m = m[0]
                        m.append(message)
                    except Exception as e:
                        print('could not append message', e)
                        print('playback', playback)

            elif 'HITL' in message:
                print(message)
                ac = int(message[3])
                # setup the new process
                user = um.getUser(websocket)
                user.addUserAircraft(ac)
                m = manager.list([message])
                p = addProcess(to_ic, (q, m))
                m_lists.append([ac, m])
                print('m lists', m_lists)
                processes.append([ac, p])
                print('processes', processes)
                p.start()
                logger.info('SERVER: Starting HITL {}'.format(processes))

            elif 'READ_USER_SETTINGS' in message:
                settings = UM.readUserSettings()
                q.put('{"name":"USER_SETTINGS"' + settings+'}')
                logger.info('SERVER: Read User Settings {}'.format(settings))

            elif 'SAVE_USER_SETTINGS' in message:
                msg = UM.saveUserSettings(message)
                q.put('{"name":"USER_SETTINGS_SAVED", "INFO":"'+msg+'"}')
                logger.info('SERVER: Saved User Settings {}'.format(message))

            elif 'RESET_USER_SETTINGS' in message:
                settings = UM.readUserSettings(0)
                q.put('{"name":"USER_SETTINGS_RESET"' + settings+'}')
                logger.info('SERVER: Reset User Settings {}'.format(settings))

            elif 'PLAYBACK' in message:

                if 'START' in message:
                    playback = True
                    # setup the new process
                    user = um.getUser(websocket)
                    user.addUserAircraft(-1)
                    m = manager.list([message])
                    p = addProcess(to_ic, (q, m))
                    m_lists.append([-1, m])
                    processes.append([-1, p])
                    p.start()
                    logger.info(
                        'SERVER: Starting Playback {}'.format(processes))

                else:
                    #  pass the message
                    m.append(message)

            else:
                logger.info(
                    'SERVER: Ignoring unassigned aircraft messages for now. {}'.format(message))

        elif 'ADD_TRAFFIC' in message:
            for m in m_lists:
                x = ['AIRCRAFT '] + [m[0]] + message
                m[1].append(x)

        elif 'REMOVE_TRAFFIC' in message:
            for m in m_lists:
                x = ['AIRCRAFT '] + [m[0]] + message
                m[1].append(x)

        else:
            logger.info('SERVER: Undefined Input Message: {}'.format(message))


async def producer_handler(websocket, path):
    while True:
        if not q.empty():
            # get the next message
            x = q.get(block=False)
            # send message over web socket
            # print(x)
            await um.notifyUsers(str(x))
        await asyncio.sleep(.001)


# allows duplex communication
async def handler(websocket, path):
    await um.register(websocket)

    consumer_task = asyncio.ensure_future(
        consumer_handler(websocket, path))
    producer_task = asyncio.ensure_future(
        producer_handler(websocket, path))
    done, pending = await asyncio.wait(
        [consumer_task, producer_task],
        return_when=asyncio.FIRST_COMPLETED,
    )
    for task in pending:
        task.cancel()

    await um.unregister(websocket)


def ask_exit(signame):
    # print("got signal %s: exit" % signame)
    loop.close()


# needed for multiprocessing
if __name__ == "__main__":
    # Set HOST to local machine ip to be accessable to other devices
    HOST = '0.0.0.0'
    # HOST = '127.0.0.1'
    PORT = 8000
    um = UM.UserManager()

    logging.basicConfig(filename='LogFiles/server_log_{}.log'.format(time.strftime("%Y-%m-%d_%H:%M:%S", time.localtime(time.time()))),
                        filemode='w',
                        format='%(asctime)s - %(message)s',
                        level=logging.INFO)

    logging.info('MAIN: Starting Logger')
    m_lists = []
    q = Queue()
    processes = []

    with Manager() as manager:

        # Open the front end websocket
        start_server = websockets.serve(handler, HOST, PORT)
        loop = asyncio.get_event_loop()
        loop.run_until_complete(start_server)
        for signame in ('SIGINT', 'SIGTERM'):
            loop.add_signal_handler(getattr(signal, signame),
                                    functools.partial(ask_exit, signame))

        print("Event loop running forever, press Ctrl+C to interrupt.")
        print("pid %s: send SIGINT or SIGTERM to exit." % os.getpid())

        # keeps the socket open forever
        try:
            loop.run_forever()
        finally:
            loop.close()
