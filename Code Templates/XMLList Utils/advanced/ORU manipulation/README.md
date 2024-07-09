# Advanced ORU Manipulation
Here we will show three different, but similar, ways to solve the same problem
using this library.

All methods will start with the same inbound ORU message ([inbound.hl7](inbound.hl7)) and
produce the same compound outbound message ([outbound.hl7](outbound.hl7).)

## Requirements
Following are the requirements for this transformation:
- The inbound message can have multiple ORC/OBR pairs representing different
   orders.
- The OBX segments collectively represent a report with the values in OBX-5
  each representing a single line of the report. This single report describes
  the results for all orders present in the message.
- The report text can be divided into two sections:
  - A header, the end of which is determined by the line beginning with
    "PHYSICIAN:" followed by zero or more non-blank lines of text, followed by
    one or more blank-lines of text.
  - The report body, which is all of the OBX segments following the header.
- In the header section,
  - any blank lines should be removed.
  - a divider consisting of the string `-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-`
    should be appended to the end.
- In the report section,
  - consecutive blank lines should be condensed to a single blank line.
  - lines longer than 60 characters should be wrapped to multiple lines so that
    they do not exceed 60 characters.
- OBX segments added in either section should retain values common to all of
  the segments in the components following OBX-5.
- OBX-1 should be numbered consecutively for all OBX segments starting at 1.
- OBX-3 should be updated with a value of "HEADER" or "REPORT" indicating to
  which section the OBX segment belongs.
- OBX-4 should be numbered consecutively within each section indicated by OBX-3
  starting each section at 1.
- A copy of the entire message should be made with only a single ORC+OBR pair
  per message for each pair present in the original message.
- ORC-1 should be updated for each copy of the message to have a value of `RE`.
- The outbound message should be all of the individual new messages joined
  together.

## Examples
The setup and approach for all of the solutions are the same. The code was
tested in a destination transformer where the inbound type is hl7v2 and the
outbound type is Raw (since we will be serializing and combining multiple
messages into one.)

The general idea is to break the message into different components that can
later be reassembled to create the new messages. The components are the "top
section" consisting of the MSH segment until the first ORC segment, the "ORC
groups" which is a collection of ORC+OBR pairs, the OBX segments comprising
the report header, and the OBX segments comprising the report body. The
header and report body sections are further modified, adding or removing OBX
segments as required, before finally reassembling individual messages for each
ORC group.

### Example 1 - functional : es5 + immutable.js
The first example is using ES5 syntax and the Immutable.js library v3.8.2. It
was tested in Mirth 3.4.0. The source code is found in
[es5+immutable.js_3_8_2.js](es5+immutable.js_3_8_2.js).
This example utilizes a functional programming approach.

We begin by converting the list of segments to an Immutable Sequence.
While this version of mirth does not support `Symbol`s, the Immutable.js
library does support the faux iterator key, and can therefore create a
lazy sequence from our XMLList without requiring an intermediate conversion
to an Array.

The Immutable.js library is used as an example of how third-party libraries can
be used to provided powerful list and sequence processing tools to even old
versions of mirth. For example, the `takeUntil`, `skipUntil`, and `flatMap`
methods.

Finally, the Immutable data structures are converted back to an XMLList by
converting to arrays, and then using the `Array.prototype.toXMLList` method
added by this library. That list is then used in an e4x template to create the
XML messages, which are then serialized to ER7.

### Example 2 - function : es6
This example was tested in Mirth 4.5.0 and started with the source from Example 1.
