"use strict"

var ease = require('./node_modules/dmx/easing').ease
var resolution = 10

function Anim(updateUniverse) {
  this.fx_stack = []
  this.updateUniverse = updateUniverse;
  this.iid;
}

Anim.prototype.add = function(to, duration, options) {
  var options  = options  || {}
  var duration = duration || resolution
  options['easing'] = options['easing'] || 'linear'
  this.fx_stack.push({'to': to, 'duration': duration, 'options': options})
  return this
}

Anim.prototype.delay = function(duration) {
  return this.add({}, duration)
}

Anim.prototype.run = function(universe, onStep) {
  var config = {}
  var t = 0
  var d = 0
  var a
  var self = this;

  var fx_stack = this.fx_stack;
  var ani_setup = function() {
    a = fx_stack.shift()
    t = 0
    d = a.duration
    config = {}
    for(var k in a.to) {
      config[k] = {
        'start': universe.get(k),
        'end':   a.to[k]
      }
    }
  }
  var ani_step = function() {
    var new_vals = {}
    for(var k in config) {
      new_vals[k] = Math.round(config[k].start + ease['linear'](t, 0, 1, d) * (config[k].end - config[k].start))
    }
    t = t + resolution
    if(onStep) onStep(new_vals);
    if (self.updateUniverse) {
      universe.update(new_vals)
    }
    if(t > d) {
      if(fx_stack.length > 0) {
        ani_setup()
      } else {
        clearInterval(self.iid)
      }
    }
  }

  ani_setup()
  clearInterval(self.iid)
  self.iid = setInterval(ani_step, resolution)
}

module.exports = Anim
