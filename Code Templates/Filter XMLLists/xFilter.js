/**
    Improved XMLList filter over built-in e4x filters.

    @copyright 2020,2025 Tony Germano
    @version 1.1 - performance optimizations for large lists
    @license MPL-2.0

    @param {XMLList} xmlList - The XMLList to be filtered
    @param {Function} callback - Function is a predicate, to test each node of the XMLList. Return
        true to keep the element, false otherwise. It accepts 3 arguments - the node, the index of the node,
        and xmlList as passed into xFilter
    @param {Number} minLimit - (Optional) throw RangeError if at least this many nodes do not pass the
        filter
    @param {Number} maxReturned - (Optional) only return up to this many results
    @param {Boolean} enforceMax - (Optional) throw RangeError if more than maxReturned results will
        be returned
    @return {XMLList} new XMLList containing filtered results
*/
function xFilter(xmlList, callback, minLimit, maxReturned, enforceMax) {
    if (minLimit === undefined) minLimit = 0
    if (maxReturned === undefined) maxReturned = Infinity
    if (enforceMax === undefined) enforceMax = false
    var ret = new XMLList()
    var i = 0
    var match_count = 0
    var first_match
    for each (var node in xmlList) {
        if (callback(node, i, xmlList)) {
            if (first_match === undefined) {
                first_match = node
                ret[match_count++] = new XML()
            }
            else {
                ret[match_count++] = node
            }
            if (enforceMax) {
                if (match_count > maxReturned) {
                    throw new RangeError('The number of filtered results is more than ' + maxReturned)
                }
            }
            else if (match_count == maxReturned) {
                break
            }
        }
        i++
    }
    if (match_count < minLimit) {
        throw new RangeError('The number of filtered results is less than ' + minLimit)
    }
    if (first_match) {
        ret[0] = first_match
    }
    return ret
}
