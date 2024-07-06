//      imports
const wrap = org.apache.commons.lang3.text.WordUtils.wrap

//      constants
const WRAP_LENGTH = 60

//      functions

// return a function that matches the given regex against a provided segment's localname
function matchSeg(regex) {return function _matchSeg(seg) {return regex.test(seg.localName())}}

// split a sequence into two on the first occurance after the first element where the predicate function is true
function splitOn(predicate, seq) {
	const left = seq.take(1).concat(seq.rest().takeUntil(predicate)),
		right = seq.skip(left.count())
	return [left, right]
}

// split sequence into List of ORC+OBR groups and remaining segments starting at first OBX. Assumes first seg is ORC.
function getORCGroups(seq) {
	const result = []
	var group, remaining = seq
	while (!matchSeg(/OBX/)(remaining.first())) {
        [group, remaining] = splitOn(matchSeg(/ORC|OBX/), remaining)
        result.push(group)
    }
    return [Immutable.List(result), remaining]
}

// return left trimmed text of given obx segment
function text(obx) {return obx['OBX.5']['OBX.5.1'].toString().trimLeft()}
function isTextNotBlank(obx) {return text(obx) !== ''}
// return partial if called with one argument
function copyAndSetText(obx,text) {
	function set(text) {const copy = obx.copy(); copy['OBX.5']['OBX.5.1'] = text; return [copy]}
	return arguments.length > 1 ? set(text) : set
}

// split the obx segments into a header and report body.
// The body starts on the first non-empty line of text following an empty line after encountering the line that starts with "PHYSICIAN."
function splitReport(seq) {
	function startsWith(substring, string) {return substring == string.slice(0, substring.length)}
	const bodySeg = seq
			.skipUntil(function(obx) {return startsWith('PHYSICIAN', text(obx))})
			.skipUntil(function(obx) {return text(obx) == ''})
			.skipUntil(function(obx) {return text(obx) != ''})
			.first(),
		header = seq.takeUntil(function(obx) {return obx === bodySeg}),
		report = seq.skip(header.count())
	return [header, report]
}

// return a mapping function that maps an obx segment to a new one while 
function setSectionAndRenumber(obx1offset, obx3) {
	return function _setSectionAndRenumber(obx, i) {
		const result = obx.copy()
		result['OBX.1']['OBX.1.1'] = obx1offset + i
		result['OBX.3'] = <OBX.3><OBX.3.1>{obx3}</OBX.3.1></OBX.3>;
		result['OBX.4']['OBX.4.1'] = 1 + i
		return result
	}
}

// filter predicate for obx segments. If the current line is blank and the previous line is blank, exclude current line.
function collapseConsecutiveBlankLines(obx, i, report) {return i == 0 || isTextNotBlank(obx) || isTextNotBlank(report.get(i-1))}

// use WordUtils.wrap to split long text into multiple lines and create additional OBX segments as needed
function wordWrap(obx) {
	const wrapped = Immutable.List(wrap(obx['OBX.5']['OBX.5.1'].toString(), WRAP_LENGTH, '\n', true).split('\n').map(String))
	return wrapped.count() == 1
		? Immutable.List.of(obx)
		: wrapped.flatMap(copyAndSetText(obx))
}

function assembleMessageSegments(ORCGroup) {
	// mutating xml, but we're so close to being done
	ORCGroup.first()['ORC.1']['ORC.1.1'] = 'RE'
	return topSection.concat(ORCGroup).concat(finalOBXSeq)
}

// Makes use of Array.prototype.toXMLList in creation of new XML message from a sequence of XML segments
function serializeMessage(messageSegmentSeq) {
	const msg = <HL7Message>{messageSegmentSeq.toArray().toXMLList()}</HL7Message>;
	return String(SerializerFactory.getSerializer('HL7V2').fromXML(msg))
}

//      main

// The creation of `seq` illustrates the use of XMLLists.toIterable
const seq = Immutable.Seq(XMLLists.toIterable(msg.children())),
	[topSection, seqAtFirstORC] = splitOn(matchSeg(/ORC/), seq),
	[ORCGroups, seqAtFirstOBX] = getORCGroups(seqAtFirstORC),
	[OBXHeader, OBXReport] = splitReport(seqAtFirstOBX),
	// remove all blank lines and add a divider
	cleanedHeader = OBXHeader
		.filter(isTextNotBlank)
		.concat(copyAndSetText(OBXHeader.first(), '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'))
		.map(setSectionAndRenumber(1,"HEADER")),
	cleanedReport = OBXReport
		.filter(collapseConsecutiveBlankLines)
		.flatMap(wordWrap)
		.map(setSectionAndRenumber(cleanedHeader.count() + 1, "REPORT")),
	finalOBXSeq = cleanedHeader.concat(cleanedReport),
	messages = ORCGroups
		.map(assembleMessageSegments)
		.map(serializeMessage)

// set encodedData to all ER7 messages joined together
msg = messages.join('')

// at this point you could also iterate over `messages` and route each one to a different channel
		
// Since we are using immutable collections and copying all xml objects before changing them,
// we can go back and see what the transformer looked like at different stages even after we
// are finished.
$c('top', topSection.toString())
$c('orcs', ORCGroups.toString())
$c('cleanedHeader', cleanedHeader.map(text).join('\n'))
$c('report', cleanedReport.map(text).join('\n'))
$c('finalOBX', finalOBXSeq.map(function(obx) {return [obx['OBX.1']['OBX.1.1'].toString(), text(obx)].join('|')}).join('\n'))
