// function tryWithResources() {
//     if (arguments.length < 2) throw "must have at least 2 arguments"

//     const resourceArgs = Array.prototype.slice.call(arguments, 0, -1)
//     const tryFunction = arguments[arguments.length-1]

//     const scope = Object.create(null)
//     const resources = resourceArgs.map(a => scope[a[0]] = a[1](Object.create(scope)))

//     try {
//         return tryFunction(scope)
//     }
//     finally {
//         resources.forEach(r=>r.close())
//     }
// }

// var newCloseable = id => new JavaAdapter(java.io.Closeable, {
//     close() {print("closed: " + id)},
//     get() {return id + ": some data"},
//     id() {return id},
//     toString() {return this.get()}
// })

// var result = tryWithResources(['r1', _ => newCloseable(1)],
//     ['r2', s => {var id = s.r1.id().doubleValue(); s.r1 = null; return newCloseable(id + 1)}],
//     ['r3', s => newCloseable(Number(s.r1.id()) + 2)],
//     resources => {
//         resources.r2 = "asdf"
//         with(resources) {
//             return {
//                 r1: String(r1.get()),
//                 r2: String(r2),
//                 r3: String(r3.get())
//             }
//         }
//     }
// )
// JSON.stringify(result,null,2)


function tryWithResources() {

    function resourceCollector(state) {
        return {
            resource: function resource(identifier, closableSupplier) {
                const id = String(identifier),
                    map = state.resourceSuppliers
                
                if (map.containsKey(id)) throw "Duplicate identifier: " + id
                map.put(id, closableSupplier)
                return resourceCollector(state)
            },
            try: function tryCollector(tryFunction) {
                state.tryFunction = tryFunction
                return tryBlock(state)
            }
        }
    }

    function tryBlock(state) {
        return {
            catch: function catchCollector(catchFunction) {
                state.catchFunction = catchFunction
                return catchBlock(state)
            },
            finally: function finallyCollector(finallyFunction) {
                state.finallyFunction = finallyFunction
                return doExecute(state)
            },
            execute: function execute() {
                return doExecute(state)
            }
        }
    }

    function catchBlock(state) {
        return {
            finally: function finallyCollector(finallyFunction) {
                state.finallyFunction = finallyFunction
                return doExecute(state)
            },
            execute: function execute() {
                return doExecute(state)
            }
        }
    }

    function doExecute(state) {
        const closer = com.google.common.io.Closer.create()

        // const resources = []
        // const closer = {
        //     register(x) {resources.push(x); return x},
        //     close() {resources.forEach(x => x.close())},
        //     rethrow(e) {throw e}
        // }


        const resourceScope = Object.create(null)


        try {
            for (var entry in Iterator(state.resourceSuppliers.entrySet())) {
                var id = entry.key
                var supplier = entry.value
                var resource = closer.register(supplier(Object.create(resourceScope)))
                resourceScope[id] = resource
            }
            return state.tryFunction(resourceScope)
        }
        catch (e) {
            var error = (!e instanceof java.lang.Throwable) ? new java.langThrowable(e.toString()) : e
            try {
                if (state.catchFunction) {
                    state.catchFunction(e)
                }
            }
            catch (e2) {
                if (!e2 instanceof java.lang.Throwable) {
                    e2 = new java.langThrowable(e2.toString())
                }
                e2.addSupressed(error)
                error = e2
            }
            finally {
                throw closer.rethrow(error)
            }
        }
        finally {
            closer.close()
        }
    }

    return resourceCollector({
        resourceSuppliers: new java.util.LinkedHashMap(),
        tryFunction: null,
        catchFunction: null,
        finallyFunction: null
    })
}
tryWithResources.makeCloseable = function makeCloseable(object, closeFunction) {
    return new JavaAdapter(java.io.Closeable, {
        close: function close() {closeFunction(object)},
        getObject: function getObject() {return object}
    })
}

var result = tryWithResources()
    .resource('r1', _ => newCloseable(1))
    .resource('r2', s => {var id = s.r1.id().doubleValue(); s.r1 = null; return newCloseable(id + 1)})
    .resource('r3', s => newCloseable(Number(s.r1.id()) + 2))
    .try(resources => {
        with(resources) {
            return {
                r1: String(r1.get()),
                r2: String(r2.get()),
                r3: String(r3.get())
            }
        }
    }).execute()

var br = new java.io.BufferedReader(new java.io.StringReader("hello"))
var result = tryWithResources().
    resource('r1', _ => newCloseable(1)).
    resource('r2', s => br).
    resource('r3', s => newCloseable(Number(s.r1.id()) + 2)).
    try(resources => {
        with(resources) {
            return {
                r1: String(r1.get()),
                r2: String(r2.readLine()),
                r3: String(r3.get())
            }
        }
    }).execute()
