//      imports
const wrap = org.apache.commons.lang3.text.WordUtils.wrap

//      constants
const WRAP_LENGTH = 60

//      functions

// return a function that matches the given regex against a provided segment's localname
const matchSeg = regex => seg => regex.test(seg.localName())

// split an array into two on the first occurance after the first element where the predicate function is true
const splitOn = (predicate, array) => {
	const index = array.findIndex((item, i) => i > 0 && predicate(item))
	return [array.slice(0, index), array.slice(index)]
}

// split array into array of ORC+OBR groups and remaining segments starting at first OBX. Assumes first seg is ORC.
const getORCGroups = array => {
	const result = []
	var group, remaining = array
	while (!matchSeg(/OBX/)(remaining[0])) {
		[group, remaining] = splitOn(matchSeg(/ORC|OBX/), remaining)
		result.push(group)
	}
	return [result, remaining]
}

// return left trimmed text of given obx segment
const text = obx => obx['OBX.5']['OBX.5.1'].toString().trimLeft()
const isTextBlank = obx => text(obx) === ''
const isTextNotBlank = obx => !isTextBlank(obx)
// return partial if called with one argument
function copyAndSetText(obx,text) {
	function set(text) {const copy = obx.copy(); copy['OBX.5']['OBX.5.1'] = text; return [copy]}
	return arguments.length > 1 ? set(text) : set
}

// split the obx segments into a header and report body.
// The body starts on the first non-empty line of text following an empty line after encountering the line that starts with "PHYSICIAN."
const splitReport = array => {
	const physicianIndex = array.findIndex(obx => text(obx).startsWith('PHYSICIAN')),
		blankIndex = array.findIndex((obx, i) => i > physicianIndex && isTextBlank(obx)),
		startOfBodyIndex = array.findIndex((obx, i) => i > blankIndex && isTextNotBlank(obx))
	return [array.slice(0,startOfBodyIndex), array.slice(startOfBodyIndex)]
}

// return a mapping function that maps an obx segment to a new copy while renumbering OBX-1 and OBX-4 and
// setting a value for OBX-3
const setSectionAndRenumber = (obx1offset, obx3) =>
	(obx, i) => {
		const result = obx.copy()
		result['OBX.1']['OBX.1.1'] = obx1offset + i
		result['OBX.3'] = <OBX.3><OBX.3.1>{obx3}</OBX.3.1></OBX.3>;
		result['OBX.4']['OBX.4.1'] = 1 + i
		return result
	}

// filter predicate for obx segments. If the current line is blank and the previous line is blank, exclude current line.
const collapseConsecutiveBlankLines = (obx, i, report) => i == 0 || isTextNotBlank(obx) || isTextNotBlank(report[i-1])

// mirth 4.5.0 still does not have Array.prototype.flatMap
const flatten = array => Array.prototype.concat.apply([], array)

// use WordUtils.wrap to split long text into multiple lines and create additional OBX segments as needed
const wordWrap = obx => {
	const wrapped = wrap(obx['OBX.5']['OBX.5.1'].toString(), WRAP_LENGTH, '\n', true).split('\n').map(String)
	return wrapped.length == 1
		? obx
		: flatten(wrapped.map(copyAndSetText(obx)))
}

const assembleMessageSegments = ORCGroup => {
	// mutating xml, but we're so close to being done
	ORCGroup[0]['ORC.1']['ORC.1.1'] = 'RE'
	return topSection.concat(ORCGroup, finalOBXSeq)
}

// Makes use of Array.prototype.toXMLList in creation of new XML message from a sequence of XML segments
const serializeMessage = messageSegmentArray => {
	const msg = <HL7Message>{messageSegmentArray.toXMLList()}</HL7Message>;
	return String(SerializerFactory.getSerializer('HL7V2').fromXML(msg))
}

//      main

const array = XMLLists.toArray(msg.children()),
	[topSection, atFirstORC] = splitOn(matchSeg(/ORC/), array),
	[ORCGroups, atFirstOBX] = getORCGroups(atFirstORC),
	[OBXHeader, OBXReport] = splitReport(atFirstOBX),
	// remove all blank lines and add a divider
	cleanedHeader = OBXHeader
		.filter(isTextNotBlank)
		.concat(copyAndSetText(OBXHeader[0], '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'))
		.map(setSectionAndRenumber(1,"HEADER")),
	cleanedReport =
		flatten(OBXReport
			.filter(collapseConsecutiveBlankLines)
			.map(wordWrap)
		)
		.map(setSectionAndRenumber(cleanedHeader.length + 1, "REPORT")),
	finalOBXSeq = cleanedHeader.concat(cleanedReport),
	messages = ORCGroups
		.map(assembleMessageSegments)
		.map(serializeMessage)

// set encodedData to all ER7 messages joined together (transformer outbound data type should be Raw)
msg = messages.join('')

// at this point you could also iterate over `messages` and route each one to a different channel
		
// Since we are returning new arrays in each stage and copying all xml objects before changing them,
// we can go back and see what the transformer looked like at different stages even after we
// are finished.
$c('top', topSection.join('\n'))
$c('orcs', ORCGroups.join('\n'))
$c('cleanedHeader', cleanedHeader.map(text).join('\n'))
$c('report', cleanedReport.map(text).join('\n'))
$c('finalOBX', finalOBXSeq.map(function(obx) {return [obx['OBX.1']['OBX.1.1'].toString(), text(obx)].join('|')}).join('\n'))
