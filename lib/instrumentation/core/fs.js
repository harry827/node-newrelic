'use strict'

var wrap = require('../../shimmer').wrapMethod

module.exports = initialize

function initialize(agent, fs) {
  var methods = [
    'rename',
    'truncate',
    'chown',
    'lchown',
    'fchown',
    'chmod',
    'lchmod',
    'fchmod',
    'stat',
    'lstat',
    'fstat',
    'link',
    'symlink',
    'readlink',
    'realpath',
    'unlink',
    'rmdir',
    'mkdir',
    'readdir',
    'close',
    'open',
    'utimes',
    'futimes',
    'fsync',
    'readFile',
    'writeFile',
    'appendFile',
    'exists',
    'ftruncate'
  ]

  var uninstrumented = [
    'write',
    'read'
  ]

  wrap(fs, 'fs', methods, segment)
  wrap(fs, 'fs', uninstrumented, agent.tracer.wrapFunctionNoSegment.bind(agent.tracer))
  wrap(fs, 'fs', ['watch'], wrapWatch)
  wrap(fs, 'fs', ['watchFile'], wrapWatchFile)

  function segment(fn, method) {
    return agent.tracer.wrapFunctionLast('fs.' + method, null, fn)
  }

  function wrapWatch(fn) {
    return function wrappedWatch() {
      var args = agent.tracer.slice(arguments)
      var last = args.length - 1

      if (typeof args[last] === 'function') {
        var cb = args[last]
        args[last] = agent.tracer.bindFunction(cb)
      }

      return agent.tracer.bindEmitter(fn.apply(this, args))
    }
  }

  function wrapWatchFile(fn) {
    return function wrappedWatchFile() {
      var args = agent.tracer.slice(arguments)
      var last = args.length - 1

      if (typeof args[last] === 'function') {
        var cb = args[last]
        args[last] = agent.tracer.bindFunction(cb)
        // allow unwatchFile to work despite cb being wrapped
        args[last].listener = cb
      }

      return fn.apply(this, args)
    }
  }
}
