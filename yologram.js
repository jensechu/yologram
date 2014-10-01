var tessel = require('tessel');
var accel = require('accel-mma84').use(tessel.port['A']);
var camera = require('camera-vc0706').use(tessel.port['B']);
var notificationLED = tessel.led[3];

// Wait for the camera module to say it's ready
camera.on('ready', function() {
  notificationLED.high();

  var YOLO = function() {

    // Take the picture
    camera.takePicture(function(err, image) {
      if (err) {
	console.log('error taking image', err);
      } else {
	notificationLED.low();

	// Name the image
	var name = 'yologram-' + Math.floor(Date.now()*1000) + '.jpg';

	// Save the image
	console.log('Yologram crushing down as ', name, '...');
	process.sendfile(name, image);
      }
    });
  };

  var startYOLOing = function() {

    // Initialize the accelerometer.
    accel.on('ready', function () {

      // Get y position to send save a Yologram
      // if thrown high enough
      accel.on('data', function (xyz) {
	var yPos = +xyz[1].toFixed(2);

	if (yPos > 1.8 && true) {
	  var shouldTakePicture = false;
	  YOLO();
	}
      });

    });
  };

  startYOLOing();

});
