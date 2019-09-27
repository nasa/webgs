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

import os
import sys
import logging


app_list = []
comments = []


def readFile(PATH, FILE):
    logger = logging.getLogger()
    # build the path
    complete_path = os.path.join(os.path.expanduser('~'), PATH, FILE)
    logger.info('STARTUP: Apps loaded from: {}'.format(complete_path))
    # open the file
    global comments
    global app_list
    comments = []
    app_list = []
    try:
        with open(complete_path) as f:
            content = f.readlines()

            lines = [x.rstrip() for x in content]

            for line in lines:
                # check if this app already exists
                y = [x for x in app_list if x['name'] == getName(line)]

                if len(y) == 0:
                    y = line
                else:
                    y = None

                # print('TEST: ', y)
                # print(line[1:])
                # for i in range(len(app_list)):
                #     print(app_list[i]['name'])

                if y != None:
                    # check if it is a comment or just commented out
                    if len(line) > 0 and line[0] == '!':
                        if len(line) > 1:
                            if line[1] == ' ':
                                comments.append(line)
                            else:
                                app = {'name': '', 'link': '', 'active': False}
                                app['link'] = line[1:]
                                app['name'] = getName(line)
                                logger.info(
                                    'STARTUP: False: {}'.format(app['link']))
                                app_list.append(app)
                        else:
                            comments.append(line)
                    else:
                        # add the app as active
                        if len(line) > 0:
                            app = {'name': '', 'link': '', 'active': True}
                            app['link'] = line
                            app['name'] = getName(line)
                            # print('True: ', line)
                            app_list.append(app)
            return 0
    except:
        logger.info('STARTUP: File Read Fail {}'.format(sys.exc_info()[0]))
        return 1


def getName(line):
    # check if this is comment or a app
    if len(line) <= 1 or line[1] == ' ':
        return 'ignore'
    else:
        # assume ! are still attached
        if line[0] == '!':
            line = line[1:]
        x = line.split(',')
        x = x[2].split('_')
        name = x[0].lstrip()
        return name


def writeFile(PATH, FILE):
    logger = logging.getLogger()
    complete_path = os.path.join(os.path.expanduser('~'), PATH, FILE)
    logger.info('STARTUP: App settings saved to: {}'.format(complete_path))
    try:
        file = open(complete_path, 'w')
        for item in app_list:
            if item['active'] == True:
                file.write(item['link']+'\n')
                logger.info('{}'.format(item['link']))
        for item in app_list:
            #  if false append '!' to front of link
            if item['active'] == False:
                file.write('!' + item['link']+'\n')
                logger.info('!{}'.format(item['link']))
        for item in comments:
            file.write(item)
        file.close()
        return 0
    except:
        logger.info('STARTUP: File Write Fail{}'.format(sys.exc_info()[0]))
        return 1


def showAppNames():
    print(app_list)
    if len(app_list) < 1:
        return '" "'
    out = '['
    for item in app_list:
        out = out + '{"NAME": "' + item['name'] + \
            '", "ACTIVE":"' + str(item['active']) + '"},'
    return out[:-1] + ']'


def changeAppStatus(apps):
    for x in range(0, len(apps) - 1, 2):
        app = apps[x]
        status = apps[x+1]
        for item in app_list:
            if item['name'] == app:
                if status == 'true':
                    item['active'] = True
                else:
                    item['active'] = False


def printCurrentStatus():
    logger = logging.getLogger()
    for item in app_list:
        logger.info('STARTUP: {} {}'.format(item['name'], item['active']))
