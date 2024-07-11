/**
	This provides the XMLLists library object, which contains several methods for converting
	to and from XMLList objects.

	@copyright 2024 Tony Germano
	@license MPL-2.0
*/

var XMLLists = (function () {

    // Change the value of this flag to false if you do not want to add Array.prototype.toXMLList
    const ADD_ARRAY_PROTOTYPE_TO_XMLLIST = true


    // Define iterator constant
    const REAL_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator
    const FAUX_ITERATOR_SYMBOL = '@@iterator'
    const ITERATOR_SYMBOL = REAL_ITERATOR_SYMBOL || FAUX_ITERATOR_SYMBOL

    // If option above is selected, add Array.prototype.toXMLList(). This is created so that
    // it is not enumerable. That means that it will not be iterated over if a `for...in` loop
    // is used on an array or show up as a result when calling Object.keys(Array.prototype).
    if (ADD_ARRAY_PROTOTYPE_TO_XMLLIST && (typeof Array.prototype.toXMLList === 'undefined')) {
        Object.defineProperty(Array.prototype, 'toXMLList', {
            writable: true,
            enumerable: false,
            configurable: true,
            value: function() {
                return arrayLikeToXMLList(this)
            }
        })
    }

    function XMLListToArray(xmlList) {
        const len = xmlList.length(),
            result = new Array(len)        
        for (var i = 0; i < len; i++) {
            result[i] = xmlList[i]
        }
        return result
    }

    function arrayLikeToXMLList(arrayLike) {
        // Bitwise ORing any number x with 0 returns x converted to a 32-bit integer
        const len = arrayLike.length | 0,
            result = new XMLList()

        if (len > 1) {
            // Setting the first element in the list to a dummy value with no parent prevents
            // unintentional modification of the original parent object from which the elements
            // reside while building the list.
            result[0] = new XML()
            for (var i = 1; i < len; i++) {
                result[i] = arrayLike[i]
            }
        }

        if (len > 0) {
            result[0] = arrayLike[0]
        }

        return result
    }

    function iteratorToXMLList(iterator) {
        const result = new XMLList(),
            first = iterator.next(),
            second = iterator.next()

        if (!second.done) {
            // see comment in arrayLikeToXMLList
            result[0] = new XML()
            result[1] = second.value
            for (var next = iterator.next(), i = 2; !next.done; next = iterator.next(), i++) {
                result[i] = next.value
            }
        }

        if (!first.done) {
            result[0] = first.value
        }

        return result
    }

    function from(object) {
        if (object == null) {
            return new XMLList()
        }

        if (typeof object === 'object') {
            if (ITERATOR_SYMBOL in object) {
                return iteratorToXMLList(object[ITERATOR_SYMBOL]())
            }

            // fall back to array-like if length is present, but not a 32-bit integer
            if ('length' in object) {
                return arrayLikeToXMLList(object)
            }
        }

        if (object instanceof XMLList) {
            return object.copy()
        }

        return <>{object}</>
    }

    // This implements the ES6 Iterator protocol.
    function XMLListToIterator(xmlList) {
        const len = xmlList.length()
        var index = 0

        return {
            next: function next() {
                if (index < len) {
                    return {
                        value: xmlList[index++],
                        done: false
                    }
                }
                return {done: true}
            }
        }
    }

    // This creates a new object that implements the ES6 Iterable protocol.
    function XMLListToIterable(xmlList) {
        const result = {}
        result[ITERATOR_SYMBOL] = function iterator() {
            return XMLListToIterator(xmlList)
        }
        return result
    }

    return {
        toArray: XMLListToArray,
        toIterable: XMLListToIterable,
        toIterator: XMLListToIterator,
        from: from
    }
})()
