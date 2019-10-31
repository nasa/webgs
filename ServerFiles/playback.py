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

import time
import logging
from pymavlink import mavutil, mavwp, mavparm

import ServerFiles.readLogFile as RT


class LogPlayer():
    def __init__(self, filename, filetype):
        self.paused = False
        self.speed = 1  # time multiplier, controls how fast messages are sent, negative speed will go backwards
        self.r_counter = 0
        self.f_counter = 1
        self.playtime = 0
        self.position = -99
        self.filename = 'LogFiles/' + filename
        self.filetype = filetype  # tlog, mlog
        self.messages = []      # [[ac, m, timestamp, delta],...]
        self.now = time.time()
        self.max_speed = 16
        self.jump = 1  # number of messages to jump in ff or rev will overload the queue if trying to send to fast
        self.skip_time = 30
        self.total_messages = 0
        # get ac count from readTLog

    def Play(self, value=0):
        if value == 0:
            if self.paused:
                self.paused = False
                self.jump = 1
            else:
                self.paused = True
                self.jump = 0
        else:
            self.paused = value
            if self.paused:
                self.jump = 1
            else:
                self.jump = 0

        # make sure everything gets set back to 1
        self.set_speed(1)
        self.r_counter = 0
        self.f_counter = 1

    def Rew(self):
        self.paused = False
        self.f_counter = 1
        if self.jump >= 0:
            self.set_speed(1)
            self.jump = -1
            self.r_counter = 1
        else:
            self.r_counter = self.r_counter + 1
            self.set_speed(self.speed * self.r_counter)
            self.jump = -self.speed

    def FF(self):
        self.paused = False
        self.r_counter = 0
        if self.jump <= 0:
            self.f_counter = 1
            self.set_speed(1)
            self.jump = 1

        else:
            self.f_counter = self.f_counter + 1
            self.set_speed(self.speed * self.f_counter)
            self.jump = self.speed

    def SkipForward(self):
        self.position = self.position + 50

    def getT(self):
        return time.time()

    def set_speed(self, speed):
        if abs(speed) <= self.max_speed:
            self.speed = speed

    def getMessages(self):
        logger = logging.getLogger()
        if self.filetype == 'mlog':
            self.messages = RT.readMlog(self.filename)
        elif self.filetype == 'tlog':
            self.messages = RT.readTlog(self.filename)
        else:
            logger.info(
                'Playback: Invalid file type. {}'.format(self.filetype))

        self.playtime = self.messages[-1][2]
        self.total_messages = len(self.messages)

    def getNext(self):
        if len(self.messages) <= 0:
            return []

        elif self.position == -99:
            x = self.messages[0]
            self.position = 0
            return x

        elif self.position + self.jump <= self.total_messages - 1 and self.position + self.jump >= 0 and self.speed != 0:
            x = self.messages[self.position + self.jump]
            self.position = self.position + self.jump
            time.sleep(x[3]/self.speed)
            return x
        else:
            self.Play(value=True)
            return []

    def getStats(self):
        current_time = self.messages[self.position][2]
        total_time = self.playtime
        percent_complete = (self.position / self.total_messages)*100
        return [current_time, total_time, percent_complete]
