/**
 *
 * @module BANDS
 * @version 1.0.0
 * @description <b> Communications Module </b>
 *
 *
 * @example none
 * @author Andrew Peters
 * @date May 2020
 * @copyright
 * Notices:
 * Copyright 2019 United States Government as represented by the Administrator of the National Aeronautics
 * and Space Administration. All Rights Reserved.
 *  
 * Disclaimers
 * No Warranty: THE SUBJECT SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF ANY
 * KIND, EITHER EXPRESSED, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, ANY
 * WARRANTY THAT THE SUBJECT SOFTWARE WILL CONFORM TO SPECIFICATIONS, ANY IMPLIED
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR FREEDOM FROM
 * INFRINGEMENT, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL BE ERROR FREE, OR ANY
 * WARRANTY THAT DOCUMENTATION, IF PROVIDED, WILL CONFORM TO THE SUBJECT SOFTWARE.
 * THIS AGREEMENT DOES NOT, IN ANY MANNER, CONSTITUTE AN ENDORSEMENT BY GOVERNMENT
 * AGENCY OR ANY PRIOR RECIPIENT OF ANY RESULTS, RESULTING DESIGNS, HARDWARE,
 * SOFTWARE PRODUCTS OR ANY OTHER APPLICATIONS RESULTING FROM USE OF THE SUBJECT
 * SOFTWARE.  FURTHER, GOVERNMENT AGENCY DISCLAIMS ALL WARRANTIES AND LIABILITIES
 * REGARDING THIRD-PARTY SOFTWARE, IF PRESENT IN THE ORIGINAL SOFTWARE, AND
 * DISTRIBUTES IT "AS IS."
 *  
 * Waiver and Indemnity:  RECIPIENT AGREES TO WAIVE ANY AND ALL CLAIMS AGAINST THE UNITED
 * STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR
 * RECIPIENT.  IF RECIPIENT'S USE OF THE SUBJECT SOFTWARE RESULTS IN ANY LIABILITIES,
 * DEMANDS, DAMAGES, EXPENSES OR LOSSES ARISING FROM SUCH USE, INCLUDING ANY
 * DAMAGES FROM PRODUCTS BASED ON, OR RESULTING FROM, RECIPIENT'S USE OF THE SUBJECT
 * SOFTWARE, RECIPIENT SHALL INDEMNIFY AND HOLD HARMLESS THE UNITED STATES
 * GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY PRIOR RECIPIENT,
 * TO THE EXTENT PERMITTED BY LAW.  RECIPIENT'S SOLE REMEDY FOR ANY SUCH MATTER SHALL
 * BE THE IMMEDIATE, UNILATERAL TERMINATION OF THIS AGREEMENT.
 *
 */


export class Bands {
    /**
     * @function <a name="Aircraft">Aircraft</a>
     * @description Constructor.
     * @param ac_id {string} aircraft id
     * @param aircraft_list {Array} list of aircraft objects
     * @param fp {Array} flight plan, list of waypoint objects
     * @memberof module:Aircraft
     * @class Aircraft
     * @instance
     */
    constructor() {
        this.ic_bands = {
            'type_table': {
                '0': 'UNKNOWN',
                '1': 'NONE',
                '2': 'RECOVERY',
                '3': 'NEAR',
                '4': 'MID',
                '5': 'FAR'
            },
            'type_def': {
                'FAR': {
                    'color': '#ffc107',
                    'dash': '3,10'
                },
                'MID': {
                    'color': '#ffc107',
                    'dash': '1'
                },
                'NEAR': {
                    'color': 'red',
                    'dash': '1'
                },
                'RECOVERY': {
                    'color': '#07dc0a',
                    'dash': '3,10'
                },
                'NONE': {
                    'color': null,
                    'dash': '1'
                },
                'UNKNOWN': {
                    'color': 'gray',
                    'dash': '1'
                }
            },
            'type': {
                // track
                '0': {
                    'num_bands': 0,
                    'set_recieved': true,
                    'bands': {
                        'FAR': [
                            [],
                            []
                        ],
                        'MID': [
                            [],
                            []
                        ],
                        'NEAR': [
                            [],
                            []
                        ],
                        'RECOVERY': [
                            [],
                            []
                        ],
                        'UNKNOWN': [
                            [],
                            []
                        ],
                        'NONE': [
                            [],
                            []
                        ]
                    }
                },
                // hspeed
                '1': {
                    'num_bands': 0,
                    'set_recieved': true,
                    'bands': {
                        'FAR': [
                            [],
                            []
                        ],
                        'MID': [
                            [],
                            []
                        ],
                        'NEAR': [
                            [],
                            []
                        ],
                        'RECOVERY': [
                            [],
                            []
                        ],
                        'UNKNOWN': [
                            [],
                            []
                        ],
                        'NONE': [
                            [],
                            []
                        ]
                    }
                },
                // alt
                '2': {
                    'num_bands': 0,
                    'set_recieved': true,
                    'bands': {
                        'FAR': [
                            [],
                            []
                        ],
                        'MID': [
                            [],
                            []
                        ],
                        'NEAR': [
                            [],
                            []
                        ],
                        'RECOVERY': [
                            [],
                            []
                        ],
                        'UNKNOWN': [
                            [],
                            []
                        ],
                        'NONE': [
                            [],
                            []
                        ]
                    }
                },
                // vspeed
                '3': {
                    'num_bands': 0,
                    'set_recieved': true,
                    'bands': {
                        'FAR': [
                            [],
                            []
                        ],
                        'MID': [
                            [],
                            []
                        ],
                        'NEAR': [
                            [],
                            []
                        ],
                        'RECOVERY': [
                            [],
                            []
                        ],
                        'UNKNOWN': [
                            [],
                            []
                        ],
                        'NONE': [
                            [],
                            []
                        ]
                    }
                }
            }
        }
    }
}
