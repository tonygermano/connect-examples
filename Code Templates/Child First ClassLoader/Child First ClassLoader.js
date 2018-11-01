function getChildFirstURLClassLoader(urls, parent) {
    const extClassLoader = java.lang.ClassLoader.getSystemClassLoader().getParent();
     
    function findClass(name) {
        try {
            return this.super$findClass(name);
        }
        catch (e) {
            return parent.loadClass(name);
        }
    }
    
    function loadClass(name, resolve) {
        var c = this.findLoadedClass(name);
        if (c == null) {
            try {
                c = extClassLoader.loadClass(name);
            }
            catch (e) {
                c = this.findClass(name);
            }
        }
        if (resolve) {
            this.resolveClass(c);
        }
        return c;
    }

    function importToJS(scope, name) {
          var clazz = this.loadClass(name);
          return new org.mozilla.javascript.NativeJavaClass(scope, clazz);
    }

    // TODO: resources are still found in the default order

    return new JavaAdapter(java.net.URLClassLoader, {
        findClass: findClass,
        loadClass: new org.mozilla.javascript.Synchronizer(loadClass, {}),
        importToJS: importToJS
    },
    urls, null);
}