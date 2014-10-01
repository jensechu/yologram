var location = 'San Francisco' // Write where you're tweeting from!

// Node requires
var fs = require('fs');
var https = require('https');
var crypto = require('crypto');

// Set up to Tweet
var bound = require('crypto').pseudoRandomBytes(16).toString('hex');
var ctype = 'multipart/form-data; boundary=' + bound;

// Tweeting as @TesselTweet
var oauth_consumer_key = "O7oc0pvsZn4xjgcuHuYdX4FaC";
var oauth_consumer_secret = "iJYuHFz2sD46Nvk3mcwzX8uih14aEAMgVWdWoR59nx8v6Zl7ZX";
var oauth_access_token = "2529232909-luARGU89K4CKFMvfzBjCgG6ubefzDkdDWkSB85i";
var oauth_access_secret = "GXQfuzvGdjLEs3t1HEYfhQ9x9bdBcSBVXjBkbRgwYlOE0";

// Get time
var curtime = parseInt(process.env.DEPLOY_TIMESTAMP || Date.now());

// Set up OAuth
var oauth_data = {
  oauth_consumer_key: oauth_consumer_key,
  oauth_nonce: require('crypto').pseudoRandomBytes(32).toString('hex'),
  oauth_signature_method: 'HMAC-SHA1',
  oauth_timestamp: Math.floor(curtime / 1000),
  oauth_token: oauth_access_token,
  oauth_version: '1.0'
};

var out = [].concat(
  ['POST', 'https://api.twitter.com/1.1/statuses/update_with_media.json'],
  (Object.keys(oauth_data).sort().map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(oauth_data[k]);
  }).join('&'))
).map(encodeURIComponent).join('&');

oauth_data.oauth_signature = crypto
  .createHmac('sha1', [oauth_consumer_secret, oauth_access_secret].join('&'))
  .update(out)
  .digest('base64');

var auth_header = 'OAuth ' + Object.keys(oauth_data).sort().map(function (key) {
  return key + '="' + encodeURIComponent(oauth_data[key]) + '"';
}).join(', ');

function post (status, file) {
  var req = https.request({
    port: 443,
    method: 'POST',
    hostname: 'api.twitter.com',
    path: '/1.1/statuses/update_with_media.json',
    headers: {
      Host: 'api.twitter.com',
      'Accept': '*/*',
      "User-Agent": "tessel",
      'Authorization': auth_header,
      'Content-Type': ctype,
      'Connection': 'keep-alive'
    }
  }, function (res) {
    console.log("statusCode: ", res.statusCode);
    console.log("headers: ", res.headers);

    res.on('data', function(d) {
      console.log(' ');
      console.log(' ');
      console.log(String(d));
    });
  });

  req.write('--' + bound + '\r\n');
  req.write('Content-Disposition: form-data; name="status"\r\n');
  req.write('\r\n');
  req.write(status + '\r\n');
  req.write('--' + bound + '\r\n');
  req.write('Content-Type: application/octet-stream\r\n');
  req.write('Content-Disposition: form-data; name="media[]"; filename="test.jpg"\r\n');
  req.write('\r\n');
  req.write(file);
  req.write('\r\n');
  req.write('--' + bound + '--\r\n');
  req.end();

  req.on('error', function(e) {
    console.error(e);
  });
}

var tessel = require('tessel');
console.log('Connecting camera...');
var accel = require('accel-mma84').use(tessel.port['A']);
var camera = require('camera-vc0706').use(tessel.port['B']);
console.log('required')

camera.on('ready', function(err) {
  if (err) return console.log('not ok - error on ready:', err);
  console.log('Camera connected. Setting resolution...');

  camera.setResolution('vga', function(err) {
    if (err) return console.log('not ok - error setting resolution:', err);
    console.log('Resolution set. Setting compression...');

    camera.setCompression(100, function(err) {
      if (err) return console.log('not ok - error setting compression:', err);
      console.log('Compression set.');

    });
  });

  var YOLO = function() {
    console.log('YOLOing');
    
    camera.setCompression(100, function(err) {
      camera.takePicture(function(err, image) {
        if (err) return console.log('Error taking Picture:', err);
        console.log('Yologram taken. Posting...');

        post('OH: @jensechu "YOLO!!!!!"  ' + location, image);
        tessel.led[3].high();
      });
    });

  };

  var startYOLOing = function() {
    console.log('start yoloing');

    // Initialize the accelerometer.
    accel.on('ready', function () {
      console.log('READY TO YOLO!');

      // Get y position to send save a Yologram
      // if thrown high enough
      accel.on('data', function (xyz) {
	var yPos = +xyz[1].toFixed(2);

	if (yPos > 1.8) {
	  YOLO();
	}
      });

    });
  };

  startYOLOing();

});

camera.on('error', function (err) {
  console.log('Error: ', err);
});
