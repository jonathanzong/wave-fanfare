'use strict'

var osc = require('node-osc');
var hsi2rgbw = require('./hsi2rgbw');

// init osc
var oscServer = new osc.Server(54321, '0.0.0.0');

// init dmx
var DMX = require('dmx');
var dmx = new DMX();
var universe = dmx.addUniverse('wave-fanfare',
  'enttec-usb-dmx-pro',
  '/dev/cu.usbserial-EN209974');

// route incoming osc messages
oscServer.on('message', function (msg, rinfo) {
  console.log('recv: ' + msg.join(' '));

  var addr = msg[0].substring(1).split('/');

  if (addr[0] === 'led') {
    var which = addr[1];
    if (which) {
      switch (addr[2]) {
        case 'set':
          /*
            /led/:x/set f f f
          */
          var h = msg[1];
          var s = msg[2];
          var v = msg[3];

          set(which, h, s, v);
          break;
        case 'hit':
          /*
            /led/:x/hit f
          */
          var amplitude = msg[1];
          hit(which, amplitude);
          break;
        case 'play':
          /*
            /led/:x/play f
          */
          var amplitude = msg[1];
          break;
      }
    }
  }
});

/*
 * which: (int) number of light to control
 * amp: (float) [0, 1]
 */
function hit(which, amp) {
  var attack = 100; // ms
  var decay = 900; // ms
  var to = _mapChannels(which, {
    r: Math.random() * 255 * amp,
    g: Math.random() * 255 * amp,
    b: Math.random() * 255 * amp,
    w: 0
  });
  var fade = _mapChannels(which, {
    r: 0,
    g: 0,
    b: 0,
    w: 0
  });
  new DMX.Animation()
    .add(to, attack, {
      easing: 'outExpo'
    })
    .add(fade, decay, {
      easing: 'inExpo'
    })
    .run(universe);
}

/*
 * which: (int) number of light to control
 * h: (float) [0, 360) hue
 * s: (float) [0, 1] saturation
 * v: (float) [0, 1] value / intensity
 */
function set(which, h, s, v) {
  var rgbw = hsi2rgbw(h, s, v);
  var channels = _mapChannels(which, rgbw);
  universe.update(channels);
  // TODO: send /phone/rgb r g b back to phone
}

/*
 * which: (int) number of light to control
 * rgbw: (obj) object with properties r, g, b, w
 */
function _mapChannels(which, rgbw) {
  which = which + 1; // needed if player number 0 exists
  var channels = {};
  channels[which * 4] = rgbw.r;
  channels[which * 4 + 1] = rgbw.g;
  channels[which * 4 + 2] = rgbw.b;
  channels[which * 4 + 3] = rgbw.w;
  return channels;
}

