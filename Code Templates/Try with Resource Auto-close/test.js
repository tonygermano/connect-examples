const JSCloseablePrototype = {
	id: -1,
	closed: false,
	close: function() {this.closed = true},
	toString: function() {return this.id.toString()}
}

function newCloseable(id) {
	const o = Object.create(JSCloseablePrototype)
	o.id = id
	return tryWithResources.makeCloseable(o, function(obj) {obj.close()})
}

var result = tryWithResources()
    .resource('r1', function() {return newCloseable(1)})
    .resource('r2', function(s) {var id = s.r1.object.id; s.r1 = null; return newCloseable(id + 1)})
    .resource('r3', function(s) {return newCloseable(s.r1.object.id + 2)})
    .try(function(resources) {
        with(resources) {
            return {
                r1: r1.object,
                r2: r2.object,
                r3: r3.object
            }
        }
    }).execute()

return JSON.stringify(result)
