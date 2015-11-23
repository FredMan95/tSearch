/**
 * Created by Anton on 28.02.2015.
 */
mono.param = function(params) {
    if (typeof params === 'string') return params;

    var args = [];
    for (var key in params) {
        var value = params[key];
        if (value === null || value === undefined) {
            continue;
        }
        args.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    }
    return args.join('&');
};
mono.wrapWebAppUrl = function(url) {
    "use strict";
    if (url.substr(0, 4) !== 'http') {
        return url;
    }
    if (url.indexOf('http://static.tms.mooo.com/') === 0) {
        return url;
    }
    return '/app/via?url=' + encodeURIComponent(url);
};
mono.ajax = function(obj) {
    var url = obj.url;

    var method = obj.type || 'GET';
    method = method.toUpperCase();

    var data = obj.data;

    if (data && typeof data !== "string") {
        data = mono.param(data);
    }

    if (data && method === 'GET') {
        url += (url.indexOf('?') === -1 ? '?' : '&') + data;
        data = undefined;
    }

    if (obj.cache === false && ['GET','HEAD'].indexOf(method) !== -1) {
        var nc = '_=' + Date.now();
        url += (url.indexOf('?') === -1 ? '?' : '&') + nc;
    }

    if (obj.changeUrl !== undefined) {
        url = obj.changeUrl(url, method);
    }

    if (mono.isWebApp) {
        url = mono.wrapWebAppUrl(url);
    }

    var xhr = new mono.ajax.xhr();

    xhr.open(method, url, true);

    if (obj.timeout !== undefined) {
        xhr.timeout = obj.timeout;
    }

    if (obj.dataType) {
        obj.dataType = obj.dataType.toLowerCase();

        xhr.responseType = obj.dataType;
    }

    obj.headers = obj.headers || {};

    if (obj.contentType) {
        obj.headers["Content-Type"] = obj.contentType;
    }

    if (data && !obj.headers["Content-Type"]) {
        obj.headers["Content-Type"] = 'application/x-www-form-urlencoded; charset=UTF-8';
    }

    if (obj.mimeType) {
        xhr.overrideMimeType(obj.mimeType);
    }

    for (var key in obj.headers) {
        xhr.setRequestHeader(key, obj.headers[key]);
    }

    if (obj.timeout !== undefined) {
        xhr.ontimeout = function() {
            obj.timeout(xhr);
        }
    }

    if (obj.abort !== undefined) {
        xhr.onabort = function() {
            obj.abort(xhr);
        }
    }

    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304 || xhr.status === 0) {
            var response = (obj.dataType) ? xhr.response : xhr.responseText;

            return obj.success && obj.success(response, xhr);
        }
        obj.error && obj.error(xhr);
    };

    xhr.onerror = function() {
        obj.error && obj.error(xhr);
    };

    if (mono.isFF && obj.safe) {
        xhr.safe = obj.safe;
    }

    xhr.send(data);

    return xhr;
};
mono.ajax.xhr = null;
mono.onReady(function() {
    "use strict";
    if (mono.isModule) {
        mono.ajax.xhr = require('sdk/net/xhr').XMLHttpRequest;
        return;
    }
    if (!mono.isFF) {
        mono.ajax.xhr = XMLHttpRequest;
        return;
    }
    mono.ajax.xhr = function () {
        "use strict";
        var xhr = {
            id: Date.now() + '_' + Math.floor((Math.random() * 10000) + 1)
        };

        var vXhr = {};
        vXhr.abort = function() {
            if (vXhr.hasOwnProperty('status')) return;
            mono.sendMessage({action: 'xhrAbort', id: xhr.id}, undefined, "service");
        };
        vXhr.open = function(method, url, async) {
            xhr.method = method;
            xhr.url = url;
            xhr.async = async;
        };
        vXhr.overrideMimeType = function(mimeType) {
            xhr.mimeType = mimeType;
        };
        vXhr.setRequestHeader = function(key, value) {
            if (!xhr.headers) {
                xhr.headers = {};
            }
            xhr.headers[key] = value;
        };
        vXhr.send = function(data) {
            xhr.data = data;
            xhr.timeout = vXhr.timeout;
            xhr.responseType = vXhr.responseType;
            xhr.safe = vXhr.safe;

            mono.sendMessage({action: 'xhr', data: xhr}, function(xhr) {
                vXhr.status = xhr.status;
                vXhr.statusText = xhr.statusText;
                vXhr.responseURL = xhr.responseURL;

                if (xhr.responseType) {
                    vXhr.response = xhr.response;
                } else {
                    vXhr.responseText = xhr.responseText;
                }

                if (!vXhr[xhr.cbType]) {
                    return;
                }

                vXhr[xhr.cbType] && vXhr[xhr.cbType](vXhr);
            }, "service");
        };
        return vXhr;
    }
});
mono.checkAvailableLanguage = function(lang) {
    "use strict";
    lang = lang.substr(0, 2);
    return ['ru', 'en'].indexOf(lang) !== -1 ? lang : 'en';
};
mono.getLocale = function() {
    "use strict";
    if (mono.getLocale.locale !== undefined) {
        return mono.getLocale.locale;
    }

    var getLang = mono.isModule ? function () {
        "use strict";
        var window = require('sdk/window/utils').getMostRecentBrowserWindow();
        return String(window.navigator.language).toLowerCase();
    } : function () {
        "use strict";
        return String(navigator.language).toLowerCase();
    };

    var lang = getLang();
    var match = lang.match(/\(([^)]+)\)/);
    if (match !== null) {
        lang = match[1];
    }

    var tPos = lang.indexOf('-');
    if (tPos !== -1) {
        var left = lang.substr(0, tPos);
        var right = lang.substr(tPos + 1);
        if (left === right) {
            lang = left;
        } else {
            lang = left + '-' + right.toUpperCase();
        }
    }
    return mono.getLocale.locale = lang;
};
mono.detectLanguage = function() {
    "use strict";
    if (mono.isChrome) {
        return chrome.i18n.getMessage('langCode');
    }
    if (mono.isModule) {
        var lang = require("sdk/l10n").get('langCode');
        if (lang !== 'langCode') {
            return lang;
        }
        return mono.getLocale();
    }
    return mono.getLocale();
};
mono.readChromeLocale = function(lang) {
    "use strict";
    var language = {};
    for (var key in lang) {
        language[key] = lang[key].message;
    }
    return language;
};
/**
 * @param {function} cb
 * @param {string} force
 * @returns {undefined}
 */
mono.getLanguage = function(cb, force) {
    "use strict";
    var lang = mono.checkAvailableLanguage(force || mono.detectLanguage());

    var url = '_locales/' + lang + '/messages.json';
    if (mono.isModule) {
        try {
            mono.language = mono.readChromeLocale(JSON.parse(require('sdk/self').data.load(url)));
            cb();
        } catch (e) {
            if (lang !== 'en') {
                return mono.getLanguage(cb, 'en');
            }
            console.error('Can\'t load language!');
        }
        return;
    }
    mono.ajax({
        url: url,
        dataType: 'json',
        success: function (data) {
            mono.language = mono.readChromeLocale(data);
            cb();
        },
        error: function () {
            if (lang !== 'en') {
                return mono.getLanguage(cb, 'en');
            }
            console.error('Can\'t load language!');
        }
    });
};
/**
 * @param {object} obj
 * @returns {boolean}
 */
mono.isEmptyObject = function(obj) {
    "use strict";
    for (var item in obj) {
        return false;
    }
    return true;
};
/**
 * Create new element
 * @param {Element|Node|String} tagName
 * @param {Object} [obj]
 * @returns {Element|Node}
 */
mono.create = function create(tagName, obj) {
    "use strict";
    var el;
    if ( typeof tagName === 'string') {
        el = document.createElement(tagName);
    } else {
        el = tagName;
    }
    if (obj !== undefined) {
        for (var attr in obj) {
            var value = obj[attr];
            if (create.hook[attr]) {
                create.hook[attr](el, value);
                continue;
            }
            el[attr] = value;
        }
    }
    return el;
};
mono.create.hook = {
    text: function(el, value) {
        "use strict";
        el.textContent = value;
    },
    data: function(el, value) {
        "use strict";
        for (var item in value) {
            if (value[item] === undefined || value[item] === null) {
                continue;
            }
            el.dataset[item] = value[item];
        }
    },
    class: function(el, value) {
        "use strict";
        if (Array.isArray(value)) {
            for (var i = 0, len = value.length; i < len; i++) {
                var className = value[i];
                if (className === null || className === undefined) {
                    continue;
                }
                el.classList.add(className);
            }
            return;
        }
        el.setAttribute('class', value);
    },
    style: function(el, value) {
        "use strict";
        if (typeof value === 'object') {
            for (var item in value) {
                el.style[item] = value[item];
            }
            return;
        }
        el.setAttribute('style', value);
    },
    append: function(el, value) {
        "use strict";
        if (Array.isArray(value)) {
            for (var i = 0, len = value.length; i < len; i++) {
                var subEl = value[i];
                if (!subEl) {
                    continue;
                }
                if (typeof (subEl) !== 'object') {
                    subEl = document.createTextNode(subEl);
                }
                el.appendChild(subEl);
            }
            return;
        }
        el.appendChild(value);
    },
    after: function(el, value) {
        "use strict";
        var hasNextEl = el.nextElementSibling;
        var elList;
        this.append(elList = document.createDocumentFragment(), value);
        if (hasNextEl !== null) {
            el.parentNode.insertBefore(elList, hasNextEl);
        } else {
            el.parentNode.appendChild(elList);
        }
    },
    on: function(el, args) {
        "use strict";
        if (Array.isArray(args[0])) {
            for (var i = 0, len = args.length; i < len; i++) {
                var subArgs = args[i];
                el.addEventListener(subArgs[0], subArgs[1], subArgs[2]);
            }
            return;
        }
        //type, onEvent, useCapture
        el.addEventListener(args[0], args[1], args[2]);
    },
    onCreate: function(el, value) {
        "use strict";
        value.call(el);
    }
};
/**
 * @param {String|Array} list
 * @param {DocumentFragment} [fragment]
 * @returns {DocumentFragment|Element}
 */
mono.parseTemplate = function(list, fragment) {
    "use strict";
    if (typeof list === "string") {
        list = list.replace(/"/g, '\\"').replace(/\\'/g, '\\u0027').replace(/'/g, '"').replace(/([{,]{1})\s*([a-zA-Z0-9]+):/g, '$1"$2":');
        try {
            list = JSON.parse(list);
        } catch (e) {
            return document.createTextNode(list);
        }
    }
    fragment = fragment || document.createDocumentFragment();
    for (var i = 0, len = list.length; i < len; i++) {
        var item = list[i];
        if (typeof item === 'object') {
            for (var tagName in item) {
                var el = item[tagName];
                var append = el.append;
                delete el.append;
                var dEl;
                fragment.appendChild(dEl = mono.create(tagName, el));
                if (append !== undefined) {
                    mono.parseTemplate(append, dEl);
                }
            }
        } else {
            fragment.appendChild(document.createTextNode(item));
        }
    }
    return fragment;
};
/**
 * @param {object} language
 * @param {Element} [body]
 */
mono.writeLanguage = function(language, body) {
    "use strict";
    var elList = (body || document).querySelectorAll('[data-lang]');
    for (var i = 0, el; el = elList[i]; i++) {
        var langList = el.dataset.lang.split('|');
        for (var m = 0, lang; lang = langList[m]; m++) {
            var args = lang.split(',');
            var locale = language[args.shift()];
            if (locale === undefined) {
                console.log('Lang not found!', el.dataset.lang);
                continue;
            }
            if (args.length !== 0) {
                args.forEach(function (item) {
                    if (item === 'text') {
                        el.textContent = locale;
                        return 1;
                    } else
                    if (item === 'tmpl') {
                        el.textContent = '';
                        el.appendChild(mono.parseTemplate(locale));
                        return 1;
                    }
                    el.setAttribute(item, locale);
                });
            } else if (el.tagName === 'DIV') {
                el.setAttribute('title', locale);
            } else if (['A', 'LEGEND', 'SPAN', 'LI', 'TH', 'P', 'OPTION', 'H1', 'H2'].indexOf(el.tagName) !== -1) {
                el.textContent = locale;
            } else if (el.tagName === 'INPUT') {
                el.value = locale;
            } else {
                console.log('Tag name not found!', el.tagName);
            }
        }
    }
};

mono.openTab = function(url) {
    "use strict";
    if (mono.isChrome) {
        return chrome.tabs.create({url: url});
    }
    if (mono.isFF) {
        return mono.sendMessage({action: 'openTab', dataUrl: true, url: url}, undefined, 'service');
    }
};

mono.closePopup = function() {
    "use strict";
    if (mono.isFF) {
        return mono.addon.postMessage('hidePopup');
    }
};

mono.resizePopup = function(w, h) {
    "use strict";
    if (mono.isFF) {
        return mono.sendMessage({action: 'resize', height: h, width: w}, undefined, "service");
    }
};

mono.expand = function() {
    "use strict";
    for (var i = 1, item; item = arguments[i]; i++) {
        for (var key in item) {
            if (!item.hasOwnProperty(key)) continue;
            arguments[0][key] = item[key];
        }
    }
    return arguments[0];
};

mono.throttle = function(fn, threshhold, scope) {
    threshhold = threshhold || 250;
    var last;
    var deferTimer;
    return function () {
        var context = scope || this;

        var now = Date.now();
        var args = arguments;
        if (last && now < last + threshhold) {
            // hold on to it
            clearTimeout(deferTimer);
            deferTimer = setTimeout(function () {
                last = now;
                fn.apply(context, args);
            }, threshhold);
        } else {
            last = now;
            fn.apply(context, args);
        }
    };
};

mono.debounce = function(fn, delay) {
    var timer = null;
    return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            fn.apply(context, args);
        }, delay);
    };
};

mono.capitalize = function(str) {
    "use strict";
    return str[0].toUpperCase() + str.substr(1);
};


mono.nodeListToArray = function(nodeList) {
    "use strict";
    return Array.prototype.slice.call(nodeList);
};

mono.parseParam = function(url, options) {
    options = options || {};
    var startFrom = url.indexOf('?');
    var query = url;
    if (!options.argsOnly && startFrom !== -1) {
        query = url.substr(startFrom + 1);
    }
    var sep = options.sep || '&';
    var dblParamList = query.split(sep);
    var params = {};
    for (var i = 0, len = dblParamList.length; i < len; i++) {
        var item = dblParamList[i];
        var ab = item.split('=');
        if (options.skipDecode) {
            params[ab[0]] = ab[1] || '';
        } else {
            params[ab[0]] = decodeURIComponent(ab[1] || '');
        }
    }
    return params;
};

mono.trigger = function(el, type, data) {
    if (data === undefined) {
        data = {};
    }
    if (data.bubbles === undefined) {
        data.bubbles = false;
    }
    if (data.cancelable === undefined) {
        data.cancelable = false;
    }
    var event = new CustomEvent(type, data);
    el.dispatchEvent(event);
};

mono.rmChildTextNodes = function(el) {
    "use strict";
    var index = 0;
    var node;
    while (node = el.childNodes[index]) {
        if (node.nodeType !== 3) {
            index++;
            continue;
        }
        el.removeChild(node);
    }
};

mono.getPosition = function(node) {
    var box = node.getBoundingClientRect();
    return {
        top: Math.round(box.top + window.pageYOffset),
        left: Math.round(box.left + window.pageXOffset),
        width: box.width,
        height: box.height
    }
};

mono.getSize = function(node) {
    return {width: node.offsetWidth, height: node.offsetHeight};
};

mono.domToTemplate = function(fragment, list) {
    "use strict";
    list = list || [];
    for (var i = 0, el; el = fragment.childNodes[i]; i++) {
        if (el.nodeType === 3) {
            list.push(el.textContent);
            continue;
        }
        var tagName = el.tagName;
        var obj = {};
        var item = [tagName, obj];

        if (tagName === 'A') {
            obj.href = el.getAttribute('href');
            obj.target = el.getAttribute('target') || undefined;
        }

        if (el.childNodes.length > 0) {
            if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
                obj.text = el.childNodes[0].textContent;
            } else {
                obj.appendList = [];
                mono.domToTemplate(el, obj.appendList);
            }
        }
        list.push(item);
    }
    return list;
};

mono.templateToDom = function(list, fragment) {
    fragment = fragment || document.createDocumentFragment();
    for (var i = 0, len = list.length; i < len; i++) {
        var item = list[i];
        if (Array.isArray(item)) {
            var el = item[1];
            var dEl;
            fragment.appendChild(dEl = mono.create.apply(null, item));
            if (el.appendList !== undefined) {
                mono.templateToDom(el.appendList, dEl);
            }
        } else {
            fragment.appendChild(document.createTextNode(item));
        }
    }
    return fragment;
};

mono.getChild = function (node, cb) {
    var childNodes = node.childNodes;
    for (var i = 0, el; el = childNodes[i]; i++) {
        if (el.nodeType !== 1) {
            continue;
        }
        if (cb(el)) {
            return el;
        }
    }
    return null;
};

mono.hashParam = function(params) {
    "use strict";
    var _btoa = !mono.isModule ? btoa : require("sdk/base64").encode;
    for (var key in params) {
        params[key] = _btoa(unescape(encodeURIComponent(params[key])));
    }
    params.base64 = 1;
    return mono.param(params);
};

mono.hashParseParam = function(string) {
    "use strict";
    var params = mono.parseParam(string);
    if (params.hasOwnProperty('base64')) {
        var _atob = !mono.isModule ? atob : require("sdk/base64").decode;
        delete params.base64;
        for (var key in params) {
            try {
                params[key] = decodeURIComponent(escape(_atob(params[key])));
            } catch (e) {
                console.error('Error decode param', key, params[key]);
            }
        }
    }
    return params;
};