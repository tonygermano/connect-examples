/*
 * path-to-regexp
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Blake Embrey (hello@blakeembrey.com)
 * Copyright (c) 2025 Tony Germano (tony@germano.name)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function (exports) {
    var __extends = (this && this.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            if (typeof b !== "function" && b !== null)
                throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();

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
    var TokenData = /** @class */ (function () {
        function TokenData(tokens, originalPath) {
            this.tokens = tokens;
            this.originalPath = originalPath;
        }
        return TokenData;
    }());
    exports.TokenData = TokenData;
    /**
     * ParseError is thrown when there is an error processing the path.
     */
    var PathError = /** @class */ (function (_super) {
        __extends(PathError, _super);
        function PathError(message, originalPath) {
            var _this = this;
            var text = message;
            if (originalPath)
                text += ": ".concat(originalPath);
            text += "; visit https://git.new/pathToRegexpError for info";
            _this = _super.call(this, text) || this;
            _this.originalPath = originalPath;
            return _this;
        }
        return PathError;
    }(TypeError));
    exports.PathError = PathError;
    /**
     * Parse a string for the raw tokens.
     */
    function parse(str, options) {
        if (options === void 0) { options = {}; }
        var _a = options.encodePath, encodePath = _a === void 0 ? NOOP_VALUE : _a;
        var chars = str.split('');
        var tokens = [];
        var index = 0;
        var pos = 0;
        function name() {
            var value = "";
            if (ID_START.test(chars[index])) {
                value += chars[index];
                while (ID_CONTINUE.test(chars[++index])) {
                    value += chars[index];
                }
            }
            else if (chars[index] === '"') {
                var pos_1 = index;
                while (index < chars.length) {
                    if (chars[++index] === '"') {
                        index++;
                        pos_1 = 0;
                        break;
                    }
                    if (chars[index] === "\\") {
                        value += chars[++index];
                    }
                    else {
                        value += chars[index];
                    }
                }
                if (pos_1) {
                    throw new PathError("Unterminated quote at index ".concat(pos_1), str);
                }
            }
            if (!value) {
                throw new PathError("Missing parameter name at index ".concat(index), str);
            }
            return value;
        }
        while (index < chars.length) {
            var value = chars[index];
            var type = SIMPLE_TOKENS[value];
            if (type) {
                tokens.push({ type: type, index: index++, value: value });
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
                tokens.push({ type: "CHAR", index: index++, value: value });
            }
        }
        tokens.push({ type: "END", index: index, value: "" });
        function consumeUntil(endType) {
            var output = [];
            while (true) {
                var _a = tokens[pos++], type = _a.type, value = _a.value, index_1 = _a.index;
                if (type === endType)
                    break;
                if (type === "CHAR" || type === "ESCAPED") {
                    var path = value;
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
                throw new PathError("Unexpected ".concat(type, " at index ").concat(index_1, ", expected ").concat(endType), str);
            }
            return output;
        }
        return new TokenData(consumeUntil("END"), str);
    }
    /**
     * Compile a string to a template function for the path.
     */
    function compile(path, options) {
        if (options === void 0) { options = {}; }
        var _a = options.encode, encode = _a === void 0 ? encodeURIComponent : _a, _b = options.delimiter, delimiter = _b === void 0 ? DEFAULT_DELIMITER : _b;
        var data = typeof path === "object" ? path : parse(path, options);
        var fn = tokensToFunction(data.tokens, delimiter, encode);
        return function path(params) {
            if (params === void 0) { params = {}; }
            var _a = fn(params), path = _a[0], missing = _a.slice(1);
            if (missing.length) {
                throw new TypeError("Missing parameters: ".concat(missing.join(", ")));
            }
            return path;
        };
    }
    function tokensToFunction(tokens, delimiter, encode) {
        var encoders = tokens.map((token) => tokenToFunction(token, delimiter, encode))
        return (data) => {
            var result = [""];
            for (var _i = 0, encoders_1 = encoders; _i < encoders_1.length; _i++) {
                var encoder = encoders_1[_i];
                var _a = encoder(data), value = _a[0], extras = _a.slice(1);
                result[0] += value;
                result.push.apply(result, extras);
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
            var fn_1 = tokensToFunction(token.tokens, delimiter, encode);
            return (data) => {
                var _a = fn_1(data), value = _a[0], missing = _a.slice(1);
                if (!missing.length)
                    return [value];
                return [""];
            };
        }
        var encodeValue = encode || NOOP_VALUE;
        if (token.type === "wildcard" && encode !== false) {
            return (data) => {
                var value = data[token.name];
                if (value == null)
                    return ["", token.name];
                if (!Array.isArray(value) || value.length === 0) {
                    throw new TypeError("Expected \"".concat(token.name, "\" to be a non-empty array"));
                }
                return [
                    value
                        .map((value, index) => {
                            if (typeof value !== "string") {
                                throw new TypeError("Expected \"".concat(token.name, "/").concat(index, "\" to be a string"));
                            }
                            return encodeValue(value);
                        })
                        .join(delimiter),
                ];
            };
        }
        return (data) => {
            var value = data[token.name];
            if (value == null)
                return ["", token.name];
            if (typeof value !== "string") {
                throw new TypeError("Expected \"".concat(token.name, "\" to be a string"));
            }
            return [encodeValue(value)];
        };
    }
    /**
     * Transform a path into a match function.
     */
    function match(path, options) {
        if (options === void 0) { options = {}; }
        var _a = options.decode, decode = _a === void 0 ? decodeURIComponent : _a, _b = options.delimiter, delimiter = _b === void 0 ? DEFAULT_DELIMITER : _b;
        var _c = pathToRegexp(path, options), regexp = _c.regexp, keys = _c.keys;
        var decoders = keys.map((key) => {
            if (decode === false) { return NOOP_VALUE }
            if (key.type === "param") { return decode }
            return (value) => value.split(delimiter).map(decode);
        });
        return function match(input) {
            var m = regexp.exec(input);
            if (!m) { return false }
            var path = m[0];
            var params = Object.create(null);
            for (var i = 1; i < m.length; i++) {
                if (m[i] === undefined)
                    continue;
                var key = keys[i - 1];
                var decoder = decoders[i - 1];
                params[key.name] = decoder(m[i]);
            }
            return { path: path, params: params };
        };
    }
    function pathToRegexp(path, options) {
        if (options === void 0) { options = {}; }
        var _a = options.delimiter, delimiter = _a === void 0 ? DEFAULT_DELIMITER : _a, _b = options.end, end = _b === void 0 ? true : _b, _c = options.sensitive, sensitive = _c === void 0 ? false : _c, _d = options.trailing, trailing = _d === void 0 ? true : _d;
        var keys = [];
        var flags = sensitive ? "" : "i";
        var sources = [];
        for (var _i = 0, _e = pathsToArray(path, []); _i < _e.length; _i++) {
            var input = _e[_i];
            var data = typeof input === "object" ? input : parse(input, options);
            for (var tokens of flatten(data.tokens, 0, [])) {
                sources.push(toRegExpSource(tokens, delimiter, keys, data.originalPath));
            }
        }
        var pattern = "^(?:".concat(sources.join("|"), ")");
        if (trailing)
            pattern += "(?:".concat(escape(delimiter), "$)?");
        pattern += end ? "$" : "(?=".concat(escape(delimiter), "|$)");
        var regexp = new RegExp(pattern, flags);
        return { regexp: regexp, keys: keys };
    }
    /**
     * Convert a path or array of paths into a flat array.
     */
    function pathsToArray(paths, init) {
        if (Array.isArray(paths)) {
            for (var _i = 0, paths_1 = paths; _i < paths_1.length; _i++) {
                var p = paths_1[_i];
                pathsToArray(p, init);
            }
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
        var result = "";
        var backtrack = "";
        var isSafeSegmentParam = true;
        for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
            var token = tokens_1[_i];
            if (token.type === "text") {
                result += escape(token.value);
                backtrack += token.value;
                isSafeSegmentParam || (isSafeSegmentParam = token.value.includes(delimiter));
                continue;
            }
            if (token.type === "param" || token.type === "wildcard") {
                if (!isSafeSegmentParam && !backtrack) {
                    throw new PathError("Missing text before \"".concat(token.name, "\" ").concat(token.type), originalPath);
                }
                if (token.type === "param") {
                    result += "(".concat(negate(delimiter, isSafeSegmentParam ? "" : backtrack), "+)");
                }
                else {
                    result += "([\\s\\S]+)";
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
                return "[^".concat(escape(delimiter + backtrack), "]");
            return "(?:(?!".concat(escape(delimiter), ")[^").concat(escape(backtrack), "])");
        }
        if (delimiter.length < 2) {
            return "(?:(?!".concat(escape(backtrack), ")[^").concat(escape(delimiter), "])");
        }
        return "(?:(?!".concat(escape(backtrack), "|").concat(escape(delimiter), ")[\\s\\S])");
    }
    /**
     * Stringify an array of tokens into a path string.
     */
    function stringifyTokens(tokens) {
        var value = "";
        var i = 0;
        function name(value) {
            var isSafe = isNameSafe(value) && isNextNameSafe(tokens[i]);
            return isSafe ? value : JSON.stringify(value);
        }
        while (i < tokens.length) {
            var token = tokens[i++];
            if (token.type === "text") {
                value += escapeText(token.value);
                continue;
            }
            if (token.type === "group") {
                value += "{".concat(stringifyTokens(token.tokens), "}");
                continue;
            }
            if (token.type === "param") {
                value += ":".concat(name(token.name));
                continue;
            }
            if (token.type === "wildcard") {
                value += "*".concat(name(token.name));
                continue;
            }
            throw new TypeError("Unknown token type: ".concat(token.type));
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
        var _a = name.split(''), first = _a[0], rest = _a.slice(1);
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
})(path_to_regexp = {})

const {match, compile} = path_to_regexp
var s=o=>JSON.stringify(o)
var examples = [
    [
        () => s(match("/:foo/:bar")("/test/route")),
        "{\"path\":\"/test/route\",\"params\":{\"foo\":\"test\",\"bar\":\"route\"}}"

    ],
    [
        () => s(match("/*splat")("/bar/baz")),
        "{\"path\":\"/bar/baz\",\"params\":{\"splat\":[\"bar\",\"baz\"]}}"
    ],
    [
        () => s(match("/users{/:id}/delete")("/users/delete")),
        "{\"path\":\"/users/delete\",\"params\":{}}"
    ],
    [
        () => s(match("/users{/:id}/delete")("/users/123/delete")),
        "{\"path\":\"/users/123/delete\",\"params\":{\"id\":\"123\"}}"
    ],
    [
        () => compile("/user/:id")({ id: "name" }),
        "/user/name"
    ],
    [
        () => compile("/user/:id")({ id: "cafÃ©" }),
        "/user/caf%C3%83%C2%A9"
    ],
    [
        () => compile("/*segment")({ segment: ["foo"] }),
        "/foo"
    ],
    [
        () => compile("/*segment")({ segment: ["a", "b", "c"] }),
        "/a/b/c"
    ],
    [
        () => compile("/user/:id", { encode: false })({ id: "%3A%2F" }),
        "/user/%3A%2F"
    ]
]
