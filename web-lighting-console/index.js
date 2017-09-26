var oscdmx = require('../js/osc-dmx');
var hsi2rgbw = require('../js/hsi2rgbw');

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  var which = 0;

  socket.on('hsv', function(hsv){
    for (var i = 0; i <= 12; i++) {
      oscdmx.set(i, hsv.h, hsv.s, hsv.v)
    }
    oscdmx.setPicker(hsv);
  });

  socket.on('which', function(x){
    which = x;
    console.log(which);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
