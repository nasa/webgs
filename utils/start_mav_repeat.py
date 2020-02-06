#!/usr/bin/env python3


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
