'use strict'

var osc = require('node-osc');
var hsi2rgbw = require('./hsi2rgbw');
var Animation = require('./animation');

var SerialPort = require('serialport');

/*
 * This block lists the serial ports and tries to detect the USB box
 * or prompts for user to choose which one is correct.
 */
SerialPort.list(function(err, ports) {
  var comNames = ports.map(function(port) {
    return port.comName.replace('tty', 'cu');
  })
  var usbPorts = comNames.filter(function(comName) {
    return comName.indexOf('usb') >= 0;
  });
  var listPorts = function() {
    var numberedList = comNames.map(function(comName) {
      return (comNames.indexOf(comName) + 1) + ') ' + comName;
    }).join('\n');
    prompt(numberedList + '\nEnter the number of the correct serial port: ', function(input) {
      var idx = parseInt(input, 10);
      if (idx) {
        main(comNames[idx - 1]);
      }
    })
  }
  if (usbPorts.length == 1) {
    var checkPort = function() {
      prompt('Enttec USB DMX Pro located at ' + usbPorts[0] + ' [y]/n: ', function(input) {
        if (input.toLowerCase() === 'n') {
          listPorts();
        }
        else if (input.toLowerCase() === 'y' || input.length === 0) {
          main(usbPorts[0]);
        }
        else {
          checkPort();
        }
      });
    };

    checkPort();
  }
  else {
    listPorts();
  }
});

function main(COM_PORT) {
  // init osc
  var OSC_PORT = 54321;
  var oscServer = new osc.Server(OSC_PORT, '0.0.0.0');
  console.log('listening for osc on port ' + OSC_PORT);

  // init dmx
  var DMX = require('dmx');
  var dmx = new DMX();
  var universe = dmx.addUniverse('wave-fanfare',
    'enttec-usb-dmx-pro',
    COM_PORT);
  console.log('serial opened on port ' + COM_PORT);

  // testChannels();
  // lightAll();

  // state variables
  var isHitting = {};
  var lastPlays = {};

  var animators = {};
  var cueAnimator = new Animation();

  var lightingCue = 0;
  var lightingCues = {
    0: { r: 0, g: 0, b: 0, w: 0, easeDuration: 0 }, // black
    1: { r: 108.37102044198231, g: 82.87897955801769, b: 0, w: 63.75, easeDuration: 90000 }, // warm white/gold
    2: { r: 0, g: 0, b: 0, w: 255, easeDuration: 50000 }, // cold white
    3: { r: 0, g: 122.35216125308986, b: 132.64783874691014, w: 0, easeDuration: 60000 }, // blue
    4: { r: 11.185431153471619, g: 116.31456884652837, b: 0, w: 127.5, easeDuration: 30000 }, // pale green
    5: { r: 115.5959594771724, g: 0, b: 88.4040405228276, w: 50.999999999999986, easeDuration: 60000 }, // purple
    6: { r: 255, g: 221.239542913, b: 0, w: 0, easeDuration: 30000 }, // yellow
    7: { r: 255, g: 0, b: 0, w: 0, easeDuration: 0 }, // red
    8: { r: 0, g: 0, b: 0, w: 255, easeDuration: 45000 }, // cold white
    9: { r: 0, g: 0, b: 0, w: 0, easeDuration: 500 }, // black
  };

  var activeRgbw = {
    r: 0,
    g: 0,
    b: 0,
    w: 0
  };

  var globalChannels = {};

  var tickRate = 25;

  /* send to dmx on an interval */
  setInterval(function() {
    universe.update(globalChannels);
  }, tickRate);

  /* user prompt to enter cue number */
  function promptCue() {
    prompt('Current lighting cue is ' + lightingCue + '.\nEnter cue: ', function(input) {
      var cue = parseInt(input, 10);
      if (cue !== NaN && lightingCues[cue]) {
        lightingCue = cue;
        cueAnimator
          .add(lightingCues[lightingCue], lightingCues[lightingCue].easeDuration)
          .run(activeRgbw);
      }
      else if (input === 'on') {
        lightAll(); // sets all to white
      }
      else if (input === 'off') {
        dimAll(); // sets all to white
      }
      else if (input.indexOf('set') == 0) {
        var addr = parseInt(input.split(' ')[1], 10);
        globalChannels[addr] = globalChannels[addr] ? 0 : 255;
      }
      promptCue();
    });
  }

  promptCue();

  // route incoming osc messages
  oscServer.on('message', function (msg, rinfo) {
    // console.log('recv: ' + msg.join(' '));

    var addr = msg[0].substring(1).split('/');

    if (addr[0] === 'led') {
      var which = addr[1];
      if (which) {
        if (!animators[which]) {
          animators[which] = new Animation();
        }
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
            play(which, amplitude);
            break;
        }
      }
    }
  });

  /*
   * which: (int) number of light to control
   * amp: (float) [0, 1]
   */
  function play(which, amp) {
    var to = _mapChannels(which, {
      r: activeRgbw.r * amp,
      g: activeRgbw.g * amp,
      b: activeRgbw.b * amp,
      w: activeRgbw.w * amp
    });

    lastPlays[which] = to;

    if (!isHitting[which]) {
      animators[which]
        .add(to, 100)
        .run(globalChannels);
    }
  }

  /*
   * which: (int) number of light to control
   * amp: (float) [0, 1]
   */
  function hit(which, amp) {
    var attack = 100; // ms
    var decay = 900; // ms
    isHitting[which] = true;

    var toRgbw = {
      r: activeRgbw.r * amp,
      g: activeRgbw.g * amp,
      b: activeRgbw.b * amp,
      w: activeRgbw.w * amp
    };

    lastPlays[which] = lastPlays[which] || _mapChannels(which, {
      r: 0,
      g: 0,
      b: 0,
      w: 0
    });

    var to = _mapChannels(which, toRgbw);
    animators[which]
      .add(to, attack, 'outExpo')
      .add(lastPlays[which], decay, 'inExpo')
      .run(globalChannels);

    setTimeout(function() {
      isHitting[which] = false;
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
    for (var key in channels) {
      globalChannels[key] = channels[key];
    }
    // TODO: send /phone/rgb r g b back to phone
  }

  /* constant for what offset the addresses start at (e.g. 0 means the first red address is 0) */
  var offset = 0;
  var multiplier = 5;

  /*
   * which: (int) number of light to control
   * rgbw: (obj) object with properties r, g, b, w
   */
  function _mapChannels(which, rgbw) {
    var channels = {};
    channels[which * multiplier + offset] = rgbw.r;
    channels[which * multiplier + offset + 1] = rgbw.g;
    channels[which * multiplier + offset + 2] = rgbw.b;
    channels[which * multiplier + offset + 3] = rgbw.w;
    return channels;
  }

  /*
   * which: (int) number of light to control
   * returns object with properties for rgbw
   */
  function _getRgbw(which) {
    var rgbw = {};
    rgbw.r = universe.get(which * multiplier + offset);
    rgbw.g = universe.get(which * multiplier + offset + 1);
    rgbw.b = universe.get(which * multiplier + offset + 2);
    rgbw.w = universe.get(which * multiplier + offset + 3);
    return rgbw;
  }

  /*
   * Runs through all channels and sets them one by one while logging
   * to debug which channel is mapped to which light
   */
  function testChannels() {
    for (var i = 0; i <= 512; i++) {
      setTimeout(function(i) {
        globalChannels[i] = 255;
        if (i > 0) {
          globalChannels[i - 1] = 0;
        }
      }.bind(null, i), 1000 * i);
    }
  }

  /*
   * Lights all channels to see if receiving DMX properly
   */
  function lightAll() {
    for (var i = 0; i <= 512; i++) {
      globalChannels[i] = 255;
    }
    activeRgbw = {
      r: 255,
      g: 255,
      b: 255,
      w: 255
    };
  }

  function dimAll() {
    for (var i = 0; i <= 512; i++) {
      globalChannels[i] = 0;
    }
    activeRgbw = {
      r: 0,
      g: 0,
      b: 0,
      w: 0
    };
  }

}

/*
 * Prompt for user input
 */
function prompt(question, callback) {
  var stdin = process.stdin,
      stdout = process.stdout;

  stdin.resume();
  stdout.write(question);

  stdin.once('data', function (data) {
    callback(data.toString().trim());
  });
}
