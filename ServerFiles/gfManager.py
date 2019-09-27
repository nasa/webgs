
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


from lxml import etree as ET


def save_geofence(fenceList, filename):

    top = ET.Element('Geofence')

    for fence in fenceList:
        child1 = ET.SubElement(top, 'fence', id=str(fence['id']))
        child1_1 = ET.SubElement(child1, 'type')
        child1_1.text = str(fence['type'])
        child1_2 = ET.SubElement(child1, 'num_vertices')
        child1_2.text = str(fence['numV'])
        child1_3 = ET.SubElement(child1, 'floor')
        child1_3.text = str(fence['floor'])
        child1_4 = ET.SubElement(child1, 'roof')
        child1_4.text = str(fence['roof'])
        for vertex in range(len(fence['Vertices'])):
            child1_5 = ET.SubElement(child1, 'vertex', id=str(vertex))
            child1_5_1 = ET.SubElement(child1_5, 'lat')
            child1_5_1.text = str(fence['Vertices'][vertex]['lat'])
            child1_5_2 = ET.SubElement(child1_5, 'lon')
            child1_5_2.text = str(fence['Vertices'][vertex]['lon'])

    ET.ElementTree(top).write(
        filename, pretty_print=True, xml_declaration=True)


def read_geofence(filename):

    tree = ET.parse(filename)
    root = tree.getroot()
    fenceList = []
    for child in root:
        id = int(child.get('id'))
        t = int(child.find('type').text)
        numV = int(child.find('num_vertices').text)
        floor = float(child.find('floor').text)
        roof = float(child.find('roof').text)
        Vertices = []

        if(len(child.findall('vertex')) == numV):
            for vertex in child.findall('vertex'):
                coord = (float(vertex.find('lat').text),
                         float(vertex.find('lon').text))

                Vertices.append(coord)

            Geofence = {"id": id, "type": t, "numV": numV, "floor": floor,
                        "roof": roof, "Vertices": Vertices}

        fenceList.append(Geofence)
    return fenceList
