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

# take a list of filenames
# add a header to each packet based on ac name
# merge and sort the files based on time stamp
# output one file that contains all of the data

import struct
from operator import itemgetter
from argparse import ArgumentParser
from pymavlink import mavutil, mavwp, mavparm


def fileMerge(filenames, newFileName, inpath, outpath):
    all_unsorted = []
    for i in range(len(filenames)):
        x = bytearray(struct.pack('>Q', i+1))
        # connect to the file
        print('In:', inpath + filenames[i])
        try:
            tlog = mavutil.mavlink_connection(
                inpath + filenames[i], dialect='ardupilotmega', baud=57600, write=False, planner_format=False, notimestamps=True)
            mavutil.set_dialect("ardupilotmega")
        except AttributeError:
            print(
                'File not found. Please check the filename and directory.', inpath+filenames[i])
            return

        # loop over all of the messages
        unsorted = []
        msg = ' '
        while msg:
            # parse the timestamp for sorting
            t = tlog.f.read(8)
            if len(t) != 8:
                break
            (timestamp,) = struct.unpack('>Q', t)
            timestamp = timestamp * 1.0e-6

            # get the message and convert it back to bytearray
            msg = tlog.recv_msg()
            if len(str(msg)) > 0:
                msg = msg.get_msgbuf()

                # create a list containing [id, timestamp, message]
                group = [x, timestamp, msg]

                # add it to unsorted
                unsorted.append(group)
            else:
                break

        # add unsorted to all unsorted
        all_unsorted.append(unsorted)

    tlog.close()

    # merge and sort based on timestamp
    m_top = [[all_unsorted.index(x)]+x.pop(0) for x in all_unsorted]
    m_sorted = []
    while True:
        # compare them
        m_top.sort(key=itemgetter(2))

        # put the smallest one into m_sorted
        small = m_top.pop(0)
        m_sorted.append(small[1:])

        # get the next value from the same array that was smallest
        if len(all_unsorted[small[0]]) > 0:
            m_next = small[0]
            m_top.append([m_next]+all_unsorted[m_next].pop(0))

            # check if all of the sub lists are empty
            z = [len(x) for x in all_unsorted if len(x) != 0]
            if len(z) == 0:
                break

    print('Out: ' + outpath + newFileName)
    open(outpath + newFileName, 'a').close()
    mlog = mavutil.mavlink_connection(
        outpath + newFileName, dialect='ardupilotmega', baud=57600, write=True, planner_format=False,)

    for x in m_sorted:
            # convert timestamp back to bit array
        timestamp = bytearray(struct.pack('>Q', int(x[1]*1.0e6)))
        # merge the bitarrays back together
        line = x[0]+timestamp+x[2]
        mlog.write(line)

    mlog.close()
    print('Done. File\'s merged into:', newFileName)


if __name__ == '__main__':

    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--infiles", required=True,
                        default=None, nargs='*', help="input tlog file")
    parser.add_argument("--outfile", default='merged.mlog',
                        help="output mlog file")
    parser.add_argument("--inpath", default='', help="path to tlog files")
    parser.add_argument("--outpath", default='',
                        help='path to output directory')
    args = parser.parse_args()

    fileMerge(args.infiles, args.outfile, args.inpath, args.outpath)

    # add option for mission planner format
    # input files seperatly
    # read the correct timestamp
    # convert to mavproxy timestamp (maybe a seperate program just for this)
    # output as mavproxy format
