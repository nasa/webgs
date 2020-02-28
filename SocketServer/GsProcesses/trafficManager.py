
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

import math
import time
import logging

from pymavlink import mavutil, mavwp
from GsProcesses.traffic import Traffic

wait_time = .5


class TrafficManager:
    def __init__(self):
        self.t = time.time()
        self.traffic_list = []
        self.temp_list = []

    def add_traffic(self, message):
        # parse message
        # AIRCRAFT, id, ADD_TRAFFIC, name, lat, lng, range, bearing, altitude, groundspeed, heading, verticalspeed, emiter, master
        # create new aircraft at values given
        names = [x.name for x in self.traffic_list]
        if float(message[3]) in names:
            idx = names.index(float(message[3]))
            del self.traffic_list[idx]

        ac = Traffic(float(message[1]), float(message[3]), float(message[4]),
                     float(message[5]), float(message[6]), float(message[7]),
                     float(message[8]), float(message[9]), float(message[10]),
                     float(message[11]), message[12], message[13], message[14])

        # this is dumb
        # icarous assigns an id
        # the id i assign is temporary
        # we have to make sure the new traffic messages is recieved by icarous
        # and assigned an id before adding it to the list
        self.temp_list.append(ac)

    def update_traffic(self):
        # check each aircraft in traffic list
        t = self.traffic_list + self.temp_list
        if len(t) > 0:
            tNow = time.time()
            tChange = tNow - t[0].tLast
            # wait for half a second before updating
            if tChange > wait_time:
                for i in t:
                    i.tLast = time.time()
                    # update lat, lng,
                    # z, vx0, vy0, vz0 are assumed constant for now
                    # print(i.name, i.vx0, i.vy0, i.vz0, i.x, i.y, i.z)
                    distance = i.S*tChange
                    i.x, i.y = self.GpsNewPos(i.x, i.y, i.H, distance)
                    # print('Sending traffic ', i.name)
                    # send updated pos for each added aircraft
                    i.master.mav.command_long_send(1,  # target_system
                                                   0,  # target_component
                                                   mavutil.mavlink.MAV_CMD_SPATIAL_USER_1,  # command
                                                   0,  # confirmation
                                                   i.name,  # param1
                                                   i.vx0,  # param2
                                                   i.vy0,  # param3
                                                   i.vz0,  # param4
                                                   i.x,  # param5
                                                   i.y,  # param6
                                                   i.z)  # param7

    def remove_traffic(self, message):
        # print(message)
        # print([x.name for x in self.traffic_list])
        # print([x.name for x in self.temp_list])
        logger = logging.getLogger()
        # fix this search by name and remove that item
        logger.info('{}'.format(message))
        for item in self.traffic_list:
            if item.name == float(message[1]):
                self.traffic_list.pop(self.traffic_list.index(item))
        return

    def checkTrafficList(self, name):

        if name not in [x.name for x in self.traffic_list]:
            # assume the temp list will not get backed up and have multiple items in it
            if len(self.temp_list) > 0:
                t = self.temp_list.pop(0)
                t.name = name
                self.traffic_list.append(t)
        # else:
        #     print([x.name for x in self.temp_list])
        #     print([x.name for x in self.traffic_list])

    # Stolen from Swee's js code

    def wrap_valid_longitude(self, lon):
        # wrap a longitude value around to always have a value in the range
        #    [-180, +180) i.e 0 => 0, 1 => 1, -1 => -1, 181 => -179, -181 => 179
        #
        return (((lon + 180.0) % 360.0) - 180.0)

    # Stolen from Swee's js code
    def GpsNewPos(self, lat, lon, bearing, distance):
        lat1 = math.radians(lat)
        lon1 = math.radians(lon)
        brng = math.radians(bearing)
        radius_of_earth = 6378100.0  # in meters
        dr = distance / radius_of_earth

        lat2 = math.asin(math.sin(lat1) * math.cos(dr) +
                         math.cos(lat1) * math.sin(dr) * math.cos(brng))
        lon2 = lon1 + math.atan2(math.sin(brng) * math.sin(dr) * math.cos(lat1),
                                 math.cos(dr) - math.sin(lat1) * math.sin(lat2))

        return [math.degrees(lat2), self.wrap_valid_longitude(math.degrees(lon2))]
