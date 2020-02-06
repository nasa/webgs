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
import asyncio
import os
import logging

import GsProcesses.icProcesses as ICP
import User.userControl as UC


class UserManager:
    def __init__(self):
        self.USERS = []

    async def register(self, websocket):
        user = UC.User(websocket)
        self.USERS.append(user)
        self.showAllUsers()

    async def unregister(self, websocket):
        self.USERS = [x for x in self.USERS if x.websocket != websocket]
        self.showAllUsers()

    def getUser(self, websocket):
        user = [x for x in self.USERS if x.websocket == websocket]
        return user[0]

    async def notifyUsers(self, msg):
        if self.USERS:
            for user in self.USERS:
                try:
                    await user.websocket.send(msg)
                    # print(user, user)
                except:
                    await self.unregister(user.websocket)

    def showAllUsers(self):
        logger = logging.getLogger()
        for user in self.USERS:
            logger.info('************')
            logger.info('Connection: {}'.format(str(user.websocket)))
            logger.info('AC List: {}'.format(str(user.ac_list)))
            logger.info('Visible: {}'.format(str(user.visible)))
            logger.info('Watch Only: {}'.format(str(user.watchOnly)))
            logger.info('************')


def readUserSettings(x=1):
    logger = logging.getLogger()
    dir = os.path.dirname(os.path.realpath(__file__))
    if x == 0:
        path = dir + "/../UserSettings/defaultUserSettings.txt"
    else:
        path = dir + '/../UserSettings/userSettings.txt'
    logger.info('Checking user settings: {}'.format(path))
    settings = ''
    with open(path) as f:
        content = f.readlines()
        lines = [x.rstrip() for x in content]

        for line in lines:
            word = line.split(' : ')
            if (word[0] != 'name'):
                settings = settings + ', "{}":"{}"'.format(word[0], word[1])

    return settings


def saveUserSettings(settings):
    logger = logging.getLogger()
    dir = os.path.dirname(os.path.realpath(__file__))
    path = dir + '/../UserSettings/userSettings.txt'
    logger.info('Saving user settings: {}'.format(path))
    try:
        settings = settings[4:]
        logger.info(settings)
        f = open(path, 'w')
        for i in range(int(len(settings)/2)):

            name = settings[i*2]
            value = settings[(i*2)+1]
            if (name != 'name'):
                line = '{0} : {1}\n'.format(name, value)
                f.write(line)

        f.close()
        msg = 'Settings saved. ' + path
    except:
        logger.info('Settings save Failed. Please check the save directory.')
        msg = 'Settings save Failed. Please check the save directory. ' + path

    return msg
