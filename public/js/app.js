(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json",".jade"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("listItem.jade",function(require,module,exports,__dirname,__filename,process,global){module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
 var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
 var klass = completed ? 'completed' : '';
buf.push('<div');
buf.push(attrs({ 'style':('position: relative; color:' + color), "class": (klass) }, {"style":true,"class":true}));
buf.push('>');
if ( important)
{
buf.push('<div class="important">!</div>');
}
if ( start)
{
buf.push('<a');
buf.push(attrs({ 'href':("#"), 'style':('color:' + color), 'data-date':("" + (start) + ""), "class": ('linkToCal') }, {"href":true,"style":true,"data-date":true}));
buf.push('>');
var __val__ = title
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</a><div>due on ' + escape((interp = MONTHS[start.getMonth()]) == null ? '' : interp) + ' ' + escape((interp = start.getDate()) == null ? '' : interp) + '</div>');
}
else
{
buf.push('<a');
buf.push(attrs({ 'href':(url), 'target':("_blank"), 'style':('color:' + color) }, {"href":true,"target":true,"style":true}));
buf.push('>');
var __val__ = title
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</a>');
}
buf.push('</div>');
}
return buf.join("");
}
});

require.define("settingsItem.jade",function(require,module,exports,__dirname,__filename,process,global){module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
var settings_mixin = function(labels){
var block = this.block, attributes = this.attributes || {}, escaped = this.escaped || {};
// iterate labels
;(function(){
  if ('number' == typeof labels.length) {

    for (var $index = 0, $$l = labels.length; $index < $$l; $index++) {
      var label = labels[$index];

settings_item_mixin(label);
    }

  } else {
    var $$l = 0;
    for (var $index in labels) {
      $$l++;      var label = labels[$index];

settings_item_mixin(label);
    }

  }
}).call(this);

};
var settings_item_mixin = function(label){
var block = this.block, attributes = this.attributes || {}, escaped = this.escaped || {};
 label = label || {};
 var name = label.name || '';
 var id = label.id || '';
 var disp = (label.disp === "false") ? false : true;
buf.push('<div class="wfLabel"><span>name:</span><input');
buf.push(attrs({ 'type':('text'), 'value':(name), "class": ('wfName') }, {"type":true,"value":true}));
buf.push('/><span>id:</span><input');
buf.push(attrs({ 'type':('text'), 'value':(id), "class": ('wfID') }, {"type":true,"value":true}));
buf.push('/><input');
buf.push(attrs({ 'type':('checkbox'), 'checked':(disp), "class": ('wfDisp') }, {"type":true,"checked":true}));
buf.push('/><span>Display Tag?</span><span class="deleteButton">x</span></div>');
};
settings_item_mixin();
}
return buf.join("");
}
});

require.define("/client/requires/index.js",function(require,module,exports,__dirname,__filename,process,global){var render = require('./render');

var calEvents = [];

$('#calendar').fullCalendar({
  header: {
    left:   'prev,next today',
    center: 'title',
    right:  'month,basicWeek,basicDay'
  }
});

function refreshCalendarEvents() {
  $('#calendar').fullCalendar('removeEvents');
  $('#calendar').fullCalendar('addEventSource', { events: calEvents });
  $('#calendar').fullCalendar('rerenderEvents');
};

function initializeWorkflowy() {
  if (!$('.wfItems').length)
    return $('.loading').remove();

  $.get('/getWorkflowy', function (data) {
    $('.loading').remove();
    if (!data.success) return alert("Error: invalid workflowy cookie");
    parseWFEvents(data.workflowy, getGroups(), '');
    refreshCalendarEvents();
    $('.linkToCal').click(function () {
      var date = new Date($(this).data('date'));
      $('#calendar').fullCalendar('gotoDate', date.getFullYear(), date.getMonth(), date.getDate());
    });
  });

  $('.showHidden').click(function (e) {
    $(this).closest('.list').find('.completed').toggle();
  });
};

function getGroups() {
  var groups = [];
  var allLists = $('.wfItems');
  for (var i = 0; i < allLists.length; ++i)
    groups.push({
      id: $(allLists[i]).data('wfid'),
      disp: $(allLists[i]).data('wfdisp')
    });
  return groups;
};

function parseWFEvents(wf, groups, color) {
  for (var i = 0; i < wf.length; ++i) {
    var sections = wf[i].nm.split('---')
      , newColor = grabColor(sections) || color;

    isTagged(wf[i], newColor);
    if (wf[i].ch && wf[i].ch.length)
      parseWFEvents(wf[i].ch, groups, newColor);
  }

  function isTagged(item, color) {
    for (var i = 0; i < groups.length; ++i)
      if (item.nm.indexOf(groups[i].id) !== -1 && item.nm.indexOf('#no') === -1)
        addItem(item, groups[i], color);
  };
};

function addItem(item, group, color) {
  var sections = item.nm.split('---')
    , color = grabColor(sections) || color
    , start = grabDate(sections)
    , title = sections.join('---')
    , important = title.indexOf('#important') !== -1
    ;

  if (important)
    console.log(title, 'is important');

  var re = new RegExp("#important", "g");
  title = title.replace(re, '');

  if (!group.disp) {
    re = new RegExp(group.id, "g");
    title = title.replace(re, '');
  }

  var event = {
    title: title,
    allDay: true,
    start: start,
    color: color,
    url: '//www.workflowy.com/#/' + item.id,
    completed: !!item.cp,
    important: important
  };

  if (event.start)
    calEvents.push(event);

  $('.wfItems[data-wfid="' + group.id + '"]').append(render('listItem', event));

  function grabDate(sections) {
    for (var i = 1; i < sections.length; ++i) {
      var section = sections[i];
      if (section.indexOf('due') !== -1) {
        section = section.replace('due', '');
        section = section.trim();
        section = dateFromString(section);
        sections = sections.splice(i, 1);
        return section;
      }
    }
    return '';
  };
};

function grabColor(sections) {
  for (var i = 1; i < sections.length; ++i) {
    var section = sections[i];
    if (section.indexOf('color') !== -1) {
      section = section.replace('color', '');
      section = section.trim();
      sections = sections.splice(i, 1);
      return section;
    }
  }
  return '';
};

function dateFromString(str) {
  var datePieces = str.split('/')
    , today = new Date()
    , month = today.getMonth()
    , day = today.getDate()
    , year = today.getFullYear();

  if (datePieces.length === 1) {
    day = parseInt(datePieces[0], 10);
  }

  if (datePieces.length === 2) {
    month = parseInt(datePieces[0], 10) - 1;
    day = parseInt(datePieces[1], 10);
  }

  if (datePieces.length === 3) {
    month = parseInt(datePieces[0], 10) - 1;
    day = parseInt(datePieces[1], 10);
    year = parseInt(datePieces[2], 10);
  }

  return new Date(year, month, day, 0, 0, 0, 0);
};

module.exports = initializeWorkflowy;

});

require.define("/client/requires/render.js",function(require,module,exports,__dirname,__filename,process,global){var render = require('browserijade');

module.exports = function (view, locals) {
  return render(view, locals);
};

// test
});

require.define("/node_modules/browserijade/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"./lib/middleware","browserify":"./lib/browserijade"}
});

require.define("/node_modules/browserijade/lib/browserijade.js",function(require,module,exports,__dirname,__filename,process,global){// Browserijade
// (c) 2011 David Ed Mellum
// Browserijade may be freely distributed under the MIT license.

jade = require('jade/lib/runtime');

// Render a jade file from an included folder in the Browserify
// bundle by a path local to the included templates folder.
var renderFile = function(path, locals) {
	locals = locals || {};
	path = path + '.jade';
	template = require(path);
	return template(locals);
}

// Render a pre-compiled Jade template in a self-executing closure.
var renderString = function(template) {
	return eval(template);
}

module.exports = renderFile;
module.exports.renderString = renderString;
});

require.define("/node_modules/jade/lib/runtime.js",function(require,module,exports,__dirname,__filename,process,global){
/*!
 * Jade - runtime
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Lame Array.isArray() polyfill for now.
 */

if (!Array.isArray) {
  Array.isArray = function(arr){
    return '[object Array]' == Object.prototype.toString.call(arr);
  };
}

/**
 * Lame Object.keys() polyfill for now.
 */

if (!Object.keys) {
  Object.keys = function(obj){
    var arr = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        arr.push(key);
      }
    }
    return arr;
  }
}

/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = function merge(a, b) {
  var ac = a['class'];
  var bc = b['class'];

  if (ac || bc) {
    ac = ac || [];
    bc = bc || [];
    if (!Array.isArray(ac)) ac = [ac];
    if (!Array.isArray(bc)) bc = [bc];
    ac = ac.filter(nulls);
    bc = bc.filter(nulls);
    a['class'] = ac.concat(bc).join(' ');
  }

  for (var key in b) {
    if (key != 'class') {
      a[key] = b[key];
    }
  }

  return a;
};

/**
 * Filter null `val`s.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function nulls(val) {
  return val != null;
}

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} escaped
 * @return {String}
 * @api private
 */

exports.attrs = function attrs(obj, escaped){
  var buf = []
    , terse = obj.terse;

  delete obj.terse;
  var keys = Object.keys(obj)
    , len = keys.length;

  if (len) {
    buf.push('');
    for (var i = 0; i < len; ++i) {
      var key = keys[i]
        , val = obj[key];

      if ('boolean' == typeof val || null == val) {
        if (val) {
          terse
            ? buf.push(key)
            : buf.push(key + '="' + key + '"');
        }
      } else if (0 == key.indexOf('data') && 'string' != typeof val) {
        buf.push(key + "='" + JSON.stringify(val) + "'");
      } else if ('class' == key && Array.isArray(val)) {
        buf.push(key + '="' + exports.escape(val.join(' ')) + '"');
      } else if (escaped && escaped[key]) {
        buf.push(key + '="' + exports.escape(val) + '"');
      } else {
        buf.push(key + '="' + val + '"');
      }
    }
  }

  return buf.join(' ');
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function escape(html){
  return String(html)
    .replace(/&(?!(\w+|\#\d+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

/**
 * Re-throw the given `err` in context to the
 * the jade in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

exports.rethrow = function rethrow(err, filename, lineno){
  if (!filename) throw err;

  var context = 3
    , str = require('fs').readFileSync(filename, 'utf8')
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Jade') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
};

});

require.define("fs",function(require,module,exports,__dirname,__filename,process,global){// nothing to see here... no file methods for the browser

});

require.define("/client/requires/login.js",function(require,module,exports,__dirname,__filename,process,global){
$('input[type=button]').click(function (e) {
  processLogin();
});

$('.password-field').keypress(function (e) {
  if (e.keyCode === 13)
    processLogin();
});

$($('input')[0]).focus();


function processLogin() {
  var userObj = {
    user: $('.user-field').val(),
    pass: $('.password-field').val()
  };

  if (!validate(userObj)) {
    $($('input')[0]).focus();
  } else {
    $('.login-info').css('color', '');
    $('.login-info').text('Validating...');
    $.post('/login', userObj, function (data) {
      if (data.status === "ok") {
        window.location = '/';
      } else {
        $('.login-info').css('color', 'red');
        $('.login-info').text(data.msg);
        $($('input')[0]).focus();
      }
    });
  }
};

function validate(user) {
  $('input').css('border-color', '');
  var isValid = true;

  if (!user.pass) {
    $('.password-field').css('border-color', 'red');
    isValid = false;
  }

  if (!user.user) {
    $('.user-field').css('border-color', 'red');
    isValid = false;
  }

  return isValid;
};
});

require.define("/client/requires/register.js",function(require,module,exports,__dirname,__filename,process,global){$('input[type=button]').click(function (e) {
  processRegistration();
});

$('.rkey').keypress(function (e) {
  if (e.keyCode === 13)
    processRegistration();
});

$($('input')[0]).focus();


function processRegistration() {
  var userObj = {
    fname: $('.fname').val(),
    lname: $('.lname').val(),
    user: $('.user').val(),
    email: $('.email').val(),
    pass: $('.pass').val(),
    cpass: $('.cpass').val(),
    rkey: $('.rkey').val()
  };

  if (!validate(userObj)) {
    $($('input')[0]).focus();
  } else {
    $('.register-info').css('color', '');
    $('.register-info').text('Validating...');

    $.post('/register', userObj, function (data) {
      if (data.status === "ok") {
        window.location = '/';
      } else {
        $('.register-info').css('color', 'red');
        $('.register-info').text(data.msg);
        $($('input')[0]).focus();
      }
    });
  }
};

function validate(user) {
  $('input').css('border-color', '');
  var isValid = true;

  if (!user.fname) {
    $('.fname').css('border-color', 'red');
    isValid = false;
  }

  if (!user.lname) {
    $('.lname').css('border-color', 'red');
    isValid = false;
  }

  if (!user.user) {
    $('.user').css('border-color', 'red');
    isValid = false;
  }

  if (!user.email) {
    $('.email').css('border-color', 'red');
    isValid = false;
  }

  if (!user.pass) {
    $('.pass').css('border-color', 'red');
    isValid = false;
  }

  if (!user.cpass) {
    $('.cpass').css('border-color', 'red');
    isValid = false;
  }

  if (!user.rkey) {
    $('.rkey').css('border-color', 'red');
    isValid = false;
  }

  if (user.pass !== user.cpass) {
    $('.cpass').css('border-color', 'red');
    isValid = false;
  }

  return isValid;
};

});

require.define("/client/requires/settings.js",function(require,module,exports,__dirname,__filename,process,global){var render = require('./render');

$('.deleteButton').click(function () {
  $(this).closest('.wfLabel').remove();
});

$('.addNew').click(function () {
  $(this).before(render('settingsItem'));

  $('.deleteButton').last().click(function () {
    $(this).closest('.wfLabel').remove();
  });

  $('.wfName').last().focus();
});

$('.saveAll').click(function () {
  saveAll();
});

function saveAll() {
  var settings = {
    showCalendar: !!$('.showCal-val').attr('checked'),
    wfCookie: $('.wfCookie-val').val(),
    wfLabels: []
  };

  var labels = $('.wfLabel');
  for (var i = 0; i < labels.length; ++i) {
    var label = $(labels[i]);
    var myObj = {
      name: label.find('.wfName').val(),
      id: label.find('.wfID').val(),
      disp: !!label.find('.wfDisp').attr('checked')
    };

    if (myObj.name && myObj.id)
      settings.wfLabels.push(myObj);
  }

  $.post('/updateSettings', {settings: settings}, function () {
    alert('Settings Successfully Saved!!');
    window.location.reload();
  });
};

});

require.define("/client/main.js",function(require,module,exports,__dirname,__filename,process,global){window.require = require;

});
require("/client/main.js");
})();
