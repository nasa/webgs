#!/usr/bin/env python3

from argparse import ArgumentParser
import subprocess
import signal

pro = []
x = True


def kill_repeat(signum, frame):
    global x
    global pro
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

    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--num", required=True,
                        default=1, help="number of instances to start")
    parser.add_argument("--out", required=True,
                        help="output ip address")
    parser.add_argument("--insert", nargs='*', default=None,
                        help="msg to insert. Format <type>. Currently support HEARTBEAT.")
    parser.add_argument('--version', default='python3',
                        help='Version of python to use')

    args = parser.parse_args()
    print(args)
    for i in range(int(args.num)):
        PORT = str(14510 + (i * 10))
        command = [args.version, 'mav_repeater.py', '--master',
                   'udp:0.0.0.0:'+PORT, '--out', 'udp:'+args.out+':'+PORT]
        if args.insert is not None:
            for insert in args.insert:
                command.append('--insert')
                command.append(insert)
        print(command)
        r = subprocess.Popen(command, shell=False)
        pro.append(r)

    while x:
        signal.signal(signal.SIGINT, kill_repeat)
        signal.signal(signal.SIGTERM, kill_repeat)

# python3 start_mav_repeat.py --num 4 --out 127.0.0.1 --version python3
# python mav_repeater.py --master udp:0.0.0.0:14560 --out udp:192.168.1.91:14550 udp:127.0.0.1:14570 --insert HEARTBEAT
