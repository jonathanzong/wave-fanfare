# wave-fanfare

### Prerequisites

[npm](https://www.npmjs.com/), a javascript package manager

[node.js](https://nodejs.org/en/), javascript runtime (comes with npm)

### osc to dmx (standalone, use for performance)

##### Install dependencies

```
cd js/
npm install
```

The `npm install` command will read the `package.json` in that directory to know which dependencies to install.

##### Run

```
node osc-dmx.js
```

The script will begin listening to OSC messages on port ```54321```. It will also detect or prompt for the correct serial port to open a connection to the Enttec USB DMX Pro.

Once everything is connected it will continuously have an input prompt open for setting the lighting cue number.

##### OSC messages

The script listens to the following OSC message formats:

```
/led/:x/set h s v
/led/:x/hit amp
/led/:x/play amp
```

Where `:x` in all of these is a parameter for which "player number" (indexed from 0) to send the command to.

##### DMX testing

To test which lights are set to which channels, uncomment this line and run the script:

```javascript
// testChannels();
```

### osc to dmx (with web color picker interface for funsies / testing)

##### Install dependencies

```
cd web-lighting-console
npm install
```

##### Run

```
npm start
```

This script includes ```osc-dmx.js``` as a dependency, meaning it includes the same functionality. It will start listening for OSC and connect to serial as described above.

It will also bind a web server to port ```3000```. Navigating to ```localhost:3000``` will open the web lighting console, which currently displays a color picker and an input for light number. Selecting a color on the color picker will set the specified light to that color.
