(function (require, exports) {
    "use strict";
    exports.PathError = exports.TokenData = void 0;
    exports.parse = parse;
    exports.compile = compile;
    exports.match = match;
    exports.pathToRegexp = pathToRegexp;
    exports.stringify = stringify;
    const DEFAULT_DELIMITER = "/";
    const NOOP_VALUE = (value) => value;
    // const ID_START = /^[$_\p{ID_Start}]$/u;
    // const ID_CONTINUE = /^[$\u200c\u200d\p{ID_Continue}]$/u;
    const ID_START = /^[$_a-zA-Z]$/;
    const ID_CONTINUE = /^[$_a-zA-Z0-9]$/;
    const SIMPLE_TOKENS = {
        // Groups.
        "{": "{",
        "}": "}",
        // Reserved.
        "(": "(",
        ")": ")",
        "[": "[",
        "]": "]",
        "+": "+",
        "?": "?",
        "!": "!",
    };
    /**
     * Escape text for stringify to path.
     */
    function escapeText(str) {
        return str.replace(/[{}()\[\]+?!:*\\]/g, "\\$&");
    }
    /**
     * Escape a regular expression string.
     */
    function escape(str) {
        return str.replace(/[.+*?^${}()[\]|/\\]/g, "\\$&");
    }
    /**
     * Tokenized path instance.
     */
    function TokenData(tokens, originalPath) {
        this.tokens = tokens;
        this.originalPath = originalPath;
    }
    exports.TokenData = TokenData;
    /**
     * ParseError is thrown when there is an error processing the path.
     */
    function PathError(message, originalPath) {
        var text = message;
        if (originalPath) text += ": " + originalPath;
        text += "; visit https://git.new/pathToRegexpError for info";

        // Call the parent constructor
        TypeError.call(this, text);

        this.originalPath = originalPath;
        // Manually set name for better error messages
        this.name = 'PathError';
    }
    // Set up the prototype chain for inheritance
    PathError.prototype = Object.create(TypeError.prototype);
    PathError.prototype.constructor = PathError;
    exports.PathError = PathError;

    /**
     * Parse a string for the raw tokens.
     */
    function parse(str, options) {
        options = options === undefined ? {} : options;
        const { encodePath = NOOP_VALUE } = options;
        const chars = [...str];
        const tokens = [];
        let index = 0;
        let pos = 0;
        function name() {
            let value = "";
            if (ID_START.test(chars[index])) {
                value += chars[index];
                while (ID_CONTINUE.test(chars[++index])) {
                    value += chars[index];
                }
            }
            else if (chars[index] === '"') {
                let pos = index;
                while (index < chars.length) {
                    if (chars[++index] === '"') {
                        index++;
                        pos = 0;
                        break;
                    }
                    if (chars[index] === "\\") {
                        value += chars[++index];
                    }
                    else {
                        value += chars[index];
                    }
                }
                if (pos) {
                    throw new PathError("Unterminated quote at index " + pos, str);
                }
            }
            if (!value) {
                throw new PathError("Missing parameter name at index " + index, str);
            }
            return value;
        }
        while (index < chars.length) {
            const value = chars[index];
            const type = SIMPLE_TOKENS[value];
            if (type) {
                tokens.push({ type, index: index++, value });
            }
            else if (value === "\\") {
                tokens.push({ type: "ESCAPED", index: index++, value: chars[index++] });
            }
            else if (value === ":") {
                tokens.push({ type: "PARAM", index: index++, value: name() });
            }
            else if (value === "*") {
                tokens.push({ type: "WILDCARD", index: index++, value: name() });
            }
            else {
                tokens.push({ type: "CHAR", index: index++, value });
            }
        }
        tokens.push({ type: "END", index, value: "" });
        function consumeUntil(endType) {
            const output = [];
            while (true) {
                var { type, value, index } = tokens[pos++];
                if (type === endType)
                    break;
                if (type === "CHAR" || type === "ESCAPED") {
                    let path = value;
                    while (true) {
                        var next = tokens[pos];
                        if (next.type !== "CHAR" && next.type !== "ESCAPED")
                            break;
                        pos++;
                        path += next.value;
                    }
                    output.push({ type: "text", value: encodePath(path) });
                    continue;
                }
                if (type === "PARAM") {
                    output.push({
                        type: "param",
                        name: value,
                    });
                    continue;
                }
                if (type === "WILDCARD") {
                    output.push({
                        type: "wildcard",
                        name: value,
                    });
                    continue;
                }
                if (type === "{") {
                    output.push({
                        type: "group",
                        tokens: consumeUntil("}"),
                    });
                    continue;
                }
                throw new PathError("Unexpected " + type + " at index " + index + ", expected " + endType, str);
            }
            return output;
        }
        return new TokenData(consumeUntil("END"), str);
    }
    /**
     * Compile a string to a template function for the path.
     */
    function compile(path, options = {}) {
        const { encode = encodeURIComponent, delimiter = DEFAULT_DELIMITER } = options;
        const data = typeof path === "object" ? path : parse(path, options);
        const fn = tokensToFunction(data.tokens, delimiter, encode);
        return function path(params = {}) {
            const [path, ...missing] = fn(params);
            if (missing.length) {
                throw new TypeError("Missing parameters: " + missing.join(", "));
            }
            return path;
        };
    }
    function tokensToFunction(tokens, delimiter, encode) {
        const encoders = tokens.map((token) => tokenToFunction(token, delimiter, encode));
        return (data) => {
            const result = [""];
            for (var encoder of encoders) {
                const [value, ...extras] = encoder(data);
                result[0] += value;
                result.push(...extras);
            }
            return result;
        };
    }
    /**
     * Convert a single token into a path building function.
     */
    function tokenToFunction(token, delimiter, encode) {
        if (token.type === "text")
            return () => [token.value];
        if (token.type === "group") {
            const fn = tokensToFunction(token.tokens, delimiter, encode);
            return (data) => {
                const [value, ...missing] = fn(data);
                if (!missing.length)
                    return [value];
                return [""];
            };
        }
        const encodeValue = encode || NOOP_VALUE;
        if (token.type === "wildcard" && encode !== false) {
            return (data) => {
                const value = data[token.name];
                if (value == null)
                    return ["", token.name];
                if (!Array.isArray(value) || value.length === 0) {
                    throw new TypeError(`Expected "${token.name}" to be a non-empty array`);
                }
                return [
                    value
                        .map((value, index) => {
                        if (typeof value !== "string") {
                            throw new TypeError(`Expected "${token.name}/${index}" to be a string`);
                        }
                        return encodeValue(value);
                    })
                        .join(delimiter),
                ];
            };
        }
        return (data) => {
            const value = data[token.name];
            if (value == null)
                return ["", token.name];
            if (typeof value !== "string") {
                throw new TypeError(`Expected "${token.name}" to be a string`);
            }
            return [encodeValue(value)];
        };
    }
    /**
     * Transform a path into a match function.
     */
    function match(path, options = {}) {
        const { decode = decodeURIComponent, delimiter = DEFAULT_DELIMITER } = options;
        const { regexp, keys } = pathToRegexp(path, options);
        const decoders = keys.map((key) => {
            if (decode === false)
                return NOOP_VALUE;
            if (key.type === "param")
                return decode;
            return (value) => value.split(delimiter).map(decode);
        });
        return function match(input) {
            const m = regexp.exec(input);
            if (!m)
                return false;
            const path = m[0];
            const params = Object.create(null);
            for (let i = 1; i < m.length; i++) {
                if (m[i] === undefined)
                    continue;
                const key = keys[i - 1];
                const decoder = decoders[i - 1];
                params[key.name] = decoder(m[i]);
            }
            return { path, params };
        };
    }
    function pathToRegexp(path, options = {}) {
        const { delimiter = DEFAULT_DELIMITER, end = true, sensitive = false, trailing = true, } = options;
        const keys = [];
        const flags = sensitive ? "" : "i";
        const sources = [];
        for (var input of pathsToArray(path, [])) {
            var data = typeof input === "object" ? input : parse(input, options);
            for (var tokens of flatten(data.tokens, 0, [])) {
                sources.push(toRegExpSource(tokens, delimiter, keys, data.originalPath));
            }
        }
        let pattern = `^(?:${sources.join("|")})`;
        if (trailing)
            pattern += `(?:${escape(delimiter)}$)?`;
        pattern += end ? "$" : `(?=${escape(delimiter)}|$)`;
        const regexp = new RegExp(pattern, flags);
        return { regexp, keys };
    }
    /**
     * Convert a path or array of paths into a flat array.
     */
    function pathsToArray(paths, init) {
        if (Array.isArray(paths)) {
            for (var p of paths)
                pathsToArray(p, init);
        }
        else {
            init.push(paths);
        }
        return init;
    }
    /**
     * Generate a flat list of sequence tokens from the given tokens.
     */
    function* flatten(tokens, index, init) {
        if (index === tokens.length) {
            return yield init;
        }
        const token = tokens[index];
        if (token.type === "group") {
            for (var seq of flatten(token.tokens, 0, init.slice())) {
                yield* flatten(tokens, index + 1, seq);
            }
        }
        else {
            init.push(token);
        }
        yield* flatten(tokens, index + 1, init);
    }
    /**
     * Transform a flat sequence of tokens into a regular expression.
     */
    function toRegExpSource(tokens, delimiter, keys, originalPath) {
        let result = "";
        let backtrack = "";
        let isSafeSegmentParam = true;
        for (const token of tokens) {
            if (token.type === "text") {
                result += escape(token.value);
                backtrack += token.value;
                isSafeSegmentParam || (isSafeSegmentParam = token.value.includes(delimiter));
                continue;
            }
            if (token.type === "param" || token.type === "wildcard") {
                if (!isSafeSegmentParam && !backtrack) {
                    throw new PathError(`Missing text before "${token.name}" ${token.type}`, originalPath);
                }
                if (token.type === "param") {
                    result += `(${negate(delimiter, isSafeSegmentParam ? "" : backtrack)}+)`;
                }
                else {
                    result += `([\\s\\S]+)`;
                }
                keys.push(token);
                backtrack = "";
                isSafeSegmentParam = false;
                continue;
            }
        }
        return result;
    }
    /**
     * Block backtracking on previous text and ignore delimiter string.
     */
    function negate(delimiter, backtrack) {
        if (backtrack.length < 2) {
            if (delimiter.length < 2)
                return `[^${escape(delimiter + backtrack)}]`;
            return `(?:(?!${escape(delimiter)})[^${escape(backtrack)}])`;
        }
        if (delimiter.length < 2) {
            return `(?:(?!${escape(backtrack)})[^${escape(delimiter)}])`;
        }
        return `(?:(?!${escape(backtrack)}|${escape(delimiter)})[\\s\\S])`;
    }
    /**
     * Stringify an array of tokens into a path string.
     */
    function stringifyTokens(tokens) {
        let value = "";
        let i = 0;
        function name(value) {
            const isSafe = isNameSafe(value) && isNextNameSafe(tokens[i]);
            return isSafe ? value : JSON.stringify(value);
        }
        while (i < tokens.length) {
            const token = tokens[i++];
            if (token.type === "text") {
                value += escapeText(token.value);
                continue;
            }
            if (token.type === "group") {
                value += `{${stringifyTokens(token.tokens)}}`;
                continue;
            }
            if (token.type === "param") {
                value += `:${name(token.name)}`;
                continue;
            }
            if (token.type === "wildcard") {
                value += `*${name(token.name)}`;
                continue;
            }
            throw new TypeError(`Unknown token type: ${token.type}`);
        }
        return value;
    }
    /**
     * Stringify token data into a path string.
     */
    function stringify(data) {
        return stringifyTokens(data.tokens);
    }
    /**
     * Validate the parameter name contains valid ID characters.
     */
    function isNameSafe(name) {
        const [first, ...rest] = name;
        return ID_START.test(first) && rest.every((char) => ID_CONTINUE.test(char));
    }
    /**
     * Validate the next token does not interfere with the current param name.
     */
    function isNextNameSafe(token) {
        if (token && token.type === "text")
            return !ID_CONTINUE.test(token.value[0]);
        return true;
    }
});
