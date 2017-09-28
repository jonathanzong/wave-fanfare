// animation.js

var ease = require('./node_modules/dmx/easing').ease
var resolution = 10

function Animator() {
  this.fx_queue = [];
  this.iid = null;
}

Animator.prototype.add = function(to, duration, easing) {
  var duration = duration || resolution
  this.fx_queue.push({'to': to, 'duration': duration, 'easing': easing || 'linear'});
  return this;
}

Animator.prototype.run = function(from, onStep) {
  var config = {}
  var t = 0
  var d = 0
  var a
  var self = this;
  var easing = 'linear';

  var fx_queue = this.fx_queue;
  var ani_setup = function() {
    a = fx_queue.shift()
    t = 0
    d = a.duration
    config = {}
    easing = a.easing;
    for(var k in a.to) {
      config[k] = {
        'start': from[k] || 0,
        'end':   a.to[k]
      }
    }
  }
  var ani_step = function() {
    var new_vals = {}
    for(var k in config) {
      new_vals[k] = Math.round(config[k].start + ease[easing](t, 0, 1, d) * (config[k].end - config[k].start))
    }
    t = t + resolution
    if(onStep) onStep(new_vals);
    //   universe.update(new_vals)
    for (var key in new_vals) {
      from[key] = new_vals[key];
    }
    if(t > d) {
      if(fx_queue.length > 0) {
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

module.exports = Animator;
