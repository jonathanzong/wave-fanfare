'use strict'

var osc = require('node-osc');
var hsi2rgbw = require('./hsi2rgbw');
var Animation = require('./animation');

// init osc
var oscServer = new osc.Server(54321, '0.0.0.0');

// init dmx
var DMX = require('dmx');
var dmx = new DMX();
var universe = dmx.addUniverse('wave-fanfare',
  'enttec-usb-dmx-pro',
  '/dev/cu.usbserial-EN209974');

var pickerRgbw;

var isHitting = false;

// testChannels();

// route incoming osc messages
// oscServer.on('message', function (msg, rinfo) {
//   console.log('recv: ' + msg.join(' '));
//   // console.log(isHitting);

//   var addr = msg[0].substring(1).split('/');

//   if (addr[0] === 'led') {
//     var which = addr[1];
//     if (which) {
//       switch (addr[2]) {
//         case 'set':
//           /*
//             /led/:x/set f f f
//           */
//           var h = msg[1];
//           var s = msg[2];
//           var v = msg[3];

//           set(which, h, s, v);
//           break;
//         case 'hit':
//           /*
//             /led/:x/hit f
//           */
//           var amplitude = msg[1];
//           hit(1, amplitude);
//           break;
//         case 'play':
//           /*
//             /led/:x/play f
//           */
//           var amplitude = msg[1] / 100.0;
//           if (!isHitting) {
//             play(1, amplitude);
//           }
//           break;
//       }
//     }
//   }
// });

/*
 * which: (int) number of light to control
 * amp: (float) [0, 1]
 */
function play(which, amp) {
  var channels = _mapChannels(which, {
    r: 255 * amp,
    b: 20 * amp,
    g: 130 * amp,
    w: 0
  });
  universe.update(channels);
}

/*
 * which: (int) number of light to control
 * amp: (float) [0, 1]
 */
function hit(which, amp) {
  var attack = 100; // ms
  var decay = 900; // ms
  isHitting = true;

  var currentChannels = _getChannels(which);

  var channels = _mapChannels(which, {
    r: 0,
    b: 0,
    g: 0,
    w: 0
  });
  universe.update(channels);

  var toRgbw = pickerRgbw || {
    r: 255,
    g: 255,
    b: 255,
    w: 255
  };

  var to = _mapChannels(which, toRgbw);
  new Animation()
    .add(to, attack, {
      easing: 'outExpo'
    })
    .add(channels, decay, {
      easing: 'inExpo'
    })
    .run(universe);

  setTimeout(function() {
    isHitting = false;
  }, attack + decay);
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

module.exports.set = set;

module.exports.setPicker = function(hsv) {
  pickerRgbw = hsi2rgbw(hsv.h, hsv.s, hsv.v);
};

/*
 * which: (int) number of light to control
 * rgbw: (obj) object with properties r, g, b, w
 */
function _mapChannels(which, rgbw) {
  var channels = {};
  channels[which * 5] = rgbw.r;
  channels[which * 5 + 1] = rgbw.g;
  channels[which * 5 + 2] = rgbw.b;
  channels[which * 5 + 3] = rgbw.w;
  return channels;
}

function _getChannels(which) {
  var channels = {};
  channels[which * 5] = universe.get(which * 5);
  channels[which * 5 + 1] = universe.get(which * 5 + 1);
  channels[which * 5 + 2] = universe.get(which * 5 + 2);
  channels[which * 5 + 3] = universe.get(which * 5 + 3);
  return channels;
}

function testChannels() {
  for (var i = 0; i <= 512; i++) {
    setTimeout(function(i) {
      var channels = {};
      channels[i] = 20;
      console.log(i);
      if (i > 0) {
        channels[i - 1] = 0;
      }
      universe.update(channels);
    }.bind(null, i), 1000 * i);
  }
}
