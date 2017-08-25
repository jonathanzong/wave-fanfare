"use strict"

var osc = require('node-osc');

// init osc
var oscServer = new osc.Server(54321, '0.0.0.0');

// init dmx
var DMX = require('dmx');
var dmx = new DMX();
var universe = dmx.addUniverse('wave-fanfare',
  'enttec-usb-dmx-pro',
  '/dev/cu.usbserial-EN209974');

// route incoming osc messages
oscServer.on("message", function (msg, rinfo) {
  var addr = msg[0];
  console.log('recv: ' + msg.join(' '));

  switch(addr) {
    case '/led':
      var arg = msg[1];
      toggleLight(arg);
      break;
    default:
      //pass
      break;
  }
});

// sets all channels to 10 if true, 0 if false
function toggleLight(arg) {
  if (arg) {
    universe.updateAll(10);
    console.log('on');
  }
  else {
    universe.updateAll(0);
    console.log('off');
  }
}
