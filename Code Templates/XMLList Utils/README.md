# XMLList Utils
This provides a simple library for working with e4x XMLLists. All of the
functions belong to a `XMLLists` namespace. This library is designed to take
advantage of the latest javascript features available in mirth, while still
supporting older mirth versions which only support ES5. These are all
*shallow* conversions.

Four methods are defined:
- `XMLLists.toArray(xmlList)` - returns a new array holding all of the same XML
  objects from the provided XMLList
- `XMLLists.fromArray(arrayLike)` - returns a new XMLList holding all of the
  XML objects from the provided array-like object
- `XMLLists.toIterator(xmlList)` - returns an object implementing the ES6
  Iterator protocol which iterators over the provided XMLList.
- `XMLLists.toIterable(xmlList)` - returns an object implementing the ES6
  Iterable protocol¹. That is, the object has a method assigned to the
  `Symbol.iterator` key, which returns an ES6 iterator which iterates over
  the provided XMLList.

_¹Mirth versions which don't support or are not running in ES6 mode will use
the string `@@iterator` instead of `Symbol.iterator` as the property key._

Additionally, the method `Array.prototype.toXMLList` will be added, which takes
no parameters. This is a convenience method for calling `XMLLists.fromArray`
with the array upon which it is called passed as the argument to the function.
This allows for easy chaining. **IF YOU DO NOT WANT THIS METHOD ADDED**, change
the value of the `ADD_ARRAY_PROTOTYPE_TO_XMLLIST` constant from `true` to
`false`.

## Why should I use this?
While e4x is a powerful tool, most javascript developers are not familiar with
how to use it effectively. Meanwhile, javascript (and Rhino) keeps improving
its support for array-like objects and iterables. This library lets you take
advantage of the advances in native javascript as well as other libraries
designed for handling collections (see [advanced examples](advanced_examples).)

Additionally, more and more people like to write mirth code outside of the
mirth editor. This library can lesson your dependence on e4x specific syntax
that is not recognized by most IDEs and linters, most notably the
`for each...in` loop, as you will see in the examples below.

## Examples

### Example 1
Renumber the SetId of OBX segments after adding or removing some segments.

```javascript
XMLLists.toArray(msg.OBX).forEach((obx, i) => {
    obx['OBX.1']['OBX.1.1] = i + 1
})
```

### Example 2
There are many repetitions of OBR-16, representing different provider numbers
for the same provider. We want to keep only the repetition where OBR-16.9 has a
value of `NPI`. If no repetitions contain the NPI number, then keep only the
first occurrence of OBR-16. There may be multiple OBR segments where this needs
to be performed.

```javascript
XMLLists.toArray(msg.OBR).forEach(obr => {
    const npiOrdering = XMLLists.toArray(obr['OBR.16'])
        .find(obr16 => obr16['OBR.16.9'].toString() == "NPI")
    obr['OBR.16'] = npiOrdering || obr['OBR.16'][0]
})
```
