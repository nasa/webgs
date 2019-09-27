#!/usr/bin/env python3
from argparse import ArgumentParser
import os
import sys
import subprocess
import time
import signal
import webbrowser

pro = []
x = True


def start_webgs(args):
    global pro
    print('args', args)
    ms = subprocess.Popen(["python3", "multiprocess_server.py"],
                          shell=False)
    hs = subprocess.Popen(['http-server', '-p', '8082',
                           '-c-1', '-i'], shell=False)
    time.sleep(.5)

    try:
        b = webbrowser.get(using='google-chrome')
    except:
        b = webbrowser
    b.open('http://localhost:8082')

    pro = [ms, hs]

    # optionally start the offline server
    if args[0] != 0 and '.mbtiles' in args[0]:
        try:
            ti = subprocess.Popen(
                ["tileserver-gl", "OfflineTiles/"+args[0]])
            pro.append(ti)
        except FileNotFoundError:
            print(
                'Failed to launch tile server: Check installation of tileserver-gl and path to files.')

    print(pro)
    return


def kill_webgs(signum, frame):
    global x
    for item in pro:
        if item.poll() is None:
            print('Closing: ', item, signum)
            item.send_signal(signum)
        # time.sleep(1)
        try:
            os.kill(item.pid, 0)
        except:
            pass
        else:
            item.send_signal(9)
    x = False


if __name__ == '__main__':
    # global pro
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("-O", required=False,
                        default=[0], nargs='*', help="name of Tile file")

    args = parser.parse_args()
    start_webgs(args.O)
    while x:
        signal.signal(signal.SIGINT, kill_webgs)
        signal.signal(signal.SIGTERM, kill_webgs)
