
// hue setup
    var hue = require("node-hue-api"),
        HueApi = hue.HueApi,
        lightState = hue.lightState;

    var displayResult = function(result) {
        console.log(JSON.stringify(result, null, 2));
    };

    var host = "192.168.1.102",							// put in your ip
        username = "20b50b25e984427bdb2af116e64753",	// put in your username
        api = new HueApi(host, username),
        state;

// variables for light
	var rNumber=0, gNumber=0, bNumber=0, alphaNumber=0,
	    red = 0, green = 0, blue = 0, brightness = 100;
	var increment = 10, ledDirection = 1,
	    redDirection = 1, greenDirection = 1, blueDirection = 1;
	var lightIsOff = false;

// xbee setup
	var serialPort = require('serialport'),				// include the library
	   SerialPort = serialPort.SerialPort,				// make a local instance of it
	   portName = '/dev/tty.usbserial-A901QJFS';		// put in your port name

	var myPort = new SerialPort(portName, {
		baudRate: 9600
	});

	var lastData=0;
	var myPacket = [];
	var sensorA = 0, sensorB = 0, sensorC = 0, sensorD = 0;
	var setLightCountdown = 0;




//======================================================================

	myPort.on('open', showPortOpen);
	myPort.on('data', latestDataHandler);
	myPort.on('close', showPortClose);
	myPort.on('error', showError);

//======================================================================



function showPortOpen(){
	console.log('port open. Data rate: ' + myPort.options.baudRate);
}

function latestDataHandler(data){

	for (var i=0;i<data.length;i++){
		var thisByte = data[i];

        if (thisByte==126){
            // console.log(myPacket);

			sensorA = myPacket[10];
			sensorB = myPacket[12];
			sensorC = myPacket[14];
			sensorD = myPacket[17];

            rNumber = sensorA;
            gNumber = sensorB;
            bNumber = sensorC;
            alphaNumber = sensorD;

			// set data to hue light
			setLightCountdown ++;

			if (setLightCountdown == 5) {

				if (rNumber>0 && gNumber>0 && bNumber>0){
					setBrighter(red);	// brighter & become white

				} else if (sensorA==0 && sensorB==0 && sensorC==0 && sensorD<=140){
					// console.log(".");
				} else {
					
					if (rNumber>0){
						setColorRed(red);
						console.log("set Color Red");
					}
					if (gNumber>0){
						setColorGreen(green);
						console.log("set Color Green");
					}
					if (bNumber>0){
						setColorBlue(blue);
						console.log("set Color blue");
					}
					

					if (alphaNumber>140){
						setDimmer();
						console.log("set Dimmer");
					}
				}
					

				console.log( "red: " + red + ", green: " + green + ", blue: " + blue + ", brightness: " + brightness );
				
				if (brightness>0){
					state = lightState.create().on().rgb( red, green, blue ).brightness( brightness );
					lightIsOff = false;

					api.setLightState(1, state, function(err, lights) {
					    if (err) throw err;
					    //displayResult(lights);
					});
					
				} else if (brightness==0 && !lightIsOff){
					state = lightState.create().off();
					lightIsOff = true;

					api.setLightState(1, state, function(err, lights) {
					    if (err) throw err;
					    //displayResult(lights);
					});

				} else {
					console.log("Light is off.");
				}

				setLightCountdown = 0;
			}

			// console.log(myPacket);
			
            myPacket = [];  //clear the packet

        } else {
            myPacket.push(thisByte);
        }
	}
}

function showPortClose(){
	console.log('port cloased.');
}

function showError(error){
	console.log('Serial port error: ' + error);
}



// for light
function setDimmer() {
	if (brightness >= increment){
		brightness -= increment;
	} else {
		brightness = 0;
	}
}

// setBrighter, and also set to become white
function setBrighter( rInput ) {  
	if (brightness <= 100- increment){
		brightness += increment;
	} else {
		brightness = 100;
	}

	//
	var r = rInput;

	if( r <= (255-increment) )
		r += (increment);

	red = r;
	green = r;
	blue = r;
}

function setColorWhite( rInput ) {
	
}

function setColorRed( rInput ) {
	var r = rInput;

	if (r <= increment){
		redDirection = 1;
	} else if (r >= (255-increment) ){
		redDirection = -1;
	}

	r += (increment * redDirection);
	red = r;
}

function setColorGreen( gInput ) {  
	var g = gInput;

	if (g <= increment){
		greenDirection = 1;
	} else if (g >= (255-increment) ){
		greenDirection = -1;
	}

	g += (increment * greenDirection);
	green = g;
}

function setColorBlue( bInput ) {
	var b = bInput;

	if (b <= increment){
		blueDirection = 1;
	} else if (b >= (255-increment)){
		blueDirection = -1;
	}

	b += (increment * blueDirection);
	blue = b;
}