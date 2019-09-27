#!/usr/bin/env python3

import time
import struct
from operator import itemgetter
from argparse import ArgumentParser
from pymavlink import mavutil, mavwp, mavparm


def connect_master(master):
    BAUD = 57600
    try:
        print(master)
        m = mavutil.mavlink_connection(
            master, dialect='ardupilotmega', baud=BAUD, force_connected=True)

        m.mav.request_data_stream_send(m.target_system,
                                       m.target_component,
                                       mavutil.mavlink.MAV_DATA_STREAM_ALL,
                                       BAUD,
                                       1)
    except Exception as ecpt:
        print(ecpt)
        m = 'NONE'
    print('m', m)
    return m


def connect_outputs(out):
    BAUD = 57600
    out_list = []
    for item in out:
        forwarding = mavutil.mavlink_connection(
            item, baud=BAUD, dialect='ardupilotmega', input=False)
        out_list.append(forwarding)
    print('out', out_list)
    return out_list


def handle_messages_in(master, out_list, insert, LAST_MSG, LAST_PRINT, STATUS):

    master.pre_message()
    m = master.recv()
    if len(m) > 0:
        if master.first_byte:
            master.auto_mavlink_version(m)

        msg = master.mav.parse_char(m)

        if msg is not None:
            master.post_message(msg)
            if 'BAD_DATA' not in str(msg):
                for out in out_list:
                    out.mav.srcComponent = 1
                    out.mav.srcSystem = 1
                    if insert is not None:
                        for i in insert:
                            if i == 'HEARTBEAT' and msg.name == "HEARTBEAT":

                                new_m = out.mav.heartbeat_encode(
                                    14, 3, 81, 0, 3, 3)
                                y = new_m.pack(out.mav)
                                out.write(y)

                    out.write(m)
                    LAST_MSG = time.time()
                    if STATUS == False:
                        print('LINK GOOD')
                        STATUS = True
                    # print(out, STATUS, m)

    if time.time() - LAST_MSG > 3 and time.time() - LAST_PRINT > 3:
        print('NO LINK:', master.port)
        LAST_PRINT = time.time()
        STATUS = False
    return LAST_MSG, LAST_PRINT, STATUS


def handle_messages_out(master, out_list):
    for link in out_list:
        link.pre_message()
        m = link.recv()
        if len(m) > 0:
            if link.first_byte:
                link.auto_mavlink_version(m)

            msg = link.mav.parse_char(m)

            if msg is not None:
                # print(msg)
                master.write(m)


if __name__ == '__main__':

    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--master", required=True,
                        default=None, help="input tlog file")
    parser.add_argument("--out", nargs='*',
                        help="outputs, can have multiple. Format: udp:<address>:<port> or <path>,<baud>")
    parser.add_argument("--insert", nargs='*', default=None,
                        help="msg to insert. Format <type>. Currently support HEARTBEAT.")

    LAST_MSG = time.time()
    LAST_PRINT = time.time()
    STATUS = False

    args = parser.parse_args()
    print(args)
    master = connect_master(args.master)
    out_list = connect_outputs(args.out)

    running = True
    while running:
        LAST_MSG, LAST_PRINT, STATUS = handle_messages_in(
            master, out_list, args.insert, LAST_MSG, LAST_PRINT, STATUS)
        handle_messages_out(master, out_list)

    # python mav_repeater.py --master udp:0.0.0.0:14560 --out udp:192.168.1.91:14550 udp:127.0.0.1:14570 --insert HEARTBEAT
