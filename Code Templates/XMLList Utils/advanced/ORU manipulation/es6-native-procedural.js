//      imports
const wrap = org.apache.commons.lang3.text.WordUtils.wrap

//      constants
const WRAP_LENGTH = 60

//      functions

// return a function that matches the given regex against a provided segment's localname
const matchSeg = regex => seg => regex.test(seg.localName()),
	isORC = matchSeg(/ORC/),
	isOBX = matchSeg(/OBX/)
	
// return left trimmed text of given obx segment
const text = obx => obx['OBX.5']['OBX.5.1'].toString().trimLeft(),
	isTextBlank = obx => text(obx) === '',
	isTextNotBlank = obx => !isTextBlank(obx)

// return partial if called with one argument
function copyAndSetText(obx,text) {
	function set(text) {const copy = obx.copy(); copy['OBX.5']['OBX.5.1'] = text; return copy}
	return arguments.length > 1 ? set(text) : set
}

// returns method to set OBX-1, OBX-3, and OBX-4 values in forEach loop
const setSectionAndRenumber = (obx1offset, obx3) =>
	(obx, i) => {
		obx['OBX.1']['OBX.1.1'] = obx1offset + i
		obx['OBX.3'] = <OBX.3><OBX.3.1>{obx3}</OBX.3.1></OBX.3>;
		obx['OBX.4']['OBX.4.1'] = 1 + i
	}

// use WordUtils.wrap to split long text into multiple lines and create additional OBX segments as needed
const wordWrap = obx => {
	const wrapped = wrap(obx['OBX.5']['OBX.5.1'].toString(), WRAP_LENGTH, '\n', true).split('\n').map(String)
	return wrapped.length == 1
		? [obx]
		: wrapped.map(copyAndSetText(obx))
}
	
//      main
var segmentIterator = XMLLists.toIterator(msg.children()),
	next = segmentIterator.next()

// topSection is all segments until first ORC
var topSection = []
while (!isORC(next.value)) {
	topSection.push(next.value)
	next = segmentIterator.next()
}

// each ORC segment begins a new ORCGroup. All subsequent segments are added to the current ORCGroup
// until a new group begins or an OBX segment is reached, indicating the last group is complete.
var ORCGroups = []
while (!isOBX(next.value)) {
	if (isORC(next.value)) {
		ORCGroups.push([next.value])
	}
	else {
		ORCGroups[ORCGroups.length - 1].push(next.value)
	}
	next = segmentIterator.next()
}

// all OBX segments belong to the header until the following three loops are complete
var OBXHeader = []
while (!text(next.value).startsWith('PHYSICIAN')) {
	OBXHeader.push(next.value)
	next = segmentIterator.next()
}
while (isTextNotBlank(next.value)) {
	OBXHeader.push(next.value)
	next = segmentIterator.next()
}
while (isTextBlank(next.value)) {
	OBXHeader.push(next.value)
	next = segmentIterator.next()
}

// the remaining segments all belong to the report body
var OBXReport = []
while (!next.done) {
	OBXReport.push(next.value)
	next = segmentIterator.next()	
}

$co('top', topSection.join('\n\n'))
$co('orcs', ORCGroups.join('\n\n'))
$co('originalHeader', OBXHeader.join('\n\n'))
$co('report', OBXReport.join('\n\n'))

// remove blank lines from header
OBXHeader = OBXHeader.filter(isTextNotBlank)

// append divider
OBXHeader.push(copyAndSetText(OBXHeader[0], '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'))

OBXHeader.forEach(setSectionAndRenumber(1, "HEADER"))
$co('finalHeader', OBXHeader.join('\n\n'))

var newReportBody = [],
	isLastTextNotBlank = true
	
OBXReport.forEach(obx => {
	if (isTextNotBlank(obx)) {
		wordWrap(obx).forEach(wrappedObx => newReportBody.push(wrappedObx))
	}
	else {
		if (lastTextIsNotBlank) {
			newReportBody.push(obx)
		}
	}
	isLastTextNotBlank = isTextNotBlank(obx)
})

OBXReport = newReportBody

OBXReport.forEach(setSectionAndRenumber(OBXHeader.length + 1, "REPORT"))

var messages = []
ORCGroups.forEach(group => {
	group[0]['ORC.1']['ORC.1.1'] = 'RE'
	var messageSegmentArray = topSection.concat(group, OBXHeader, OBXReport),
		xmlMessage = <HL7Message>{messageSegmentArray.toXMLList()}</HL7Message>;
	messages.push(SerializerFactory.getSerializer('HL7V2').fromXML(xmlMessage))
})

// set encodedData to all ER7 messages joined together (transformer outbound data type should be Raw)
msg = messages.join('')

// at this point you could also iterate over `messages` and route each one to a different channel
