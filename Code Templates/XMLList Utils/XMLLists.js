var XMLLists = (function () {
    
    // Change the value of this flag to false if you do not want to modify Array.prototype
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
        const len = arrayLike.length,
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
        fromArray: arrayLikeToXMLList
    }
})()
