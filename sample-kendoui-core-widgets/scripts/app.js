(function (global) {
    var app = global.app = global.app || {};

   app.id = function (element) {
            return document.getElementById(element);
        };

    app.cameraApp =  function (){};

app.cameraApp.prototype={
    _pictureSource: null,
    
    _destinationType: null,

    resultsField: null,

    watchID : null,
    
    run: function(){
        var that=this;
	    that._pictureSource = navigator.camera.PictureSourceType;
	    that._destinationType = navigator.camera.DestinationType;
        that.resultsField = app.id("result");
	    app.id("capturePhotoButton").addEventListener("click", function(){
            that._capturePhoto.apply(that,arguments);
        });
	    app.id("getPhotoFromLibraryButton").addEventListener("click", function(){
            that._getPhotoFromLibrary.apply(that,arguments)
        });
        app.id("scanQRCode").addEventListener("click", function(){
            that._scan.apply(that,arguments)
        });
        app.id("toggleFLButton").addEventListener("click", function(){
            that._toggleFlashLight.apply(that,arguments)
        });
        app.id("deviceName").addEventListener("click", function(){
            that._viewDeviceName.apply(that,arguments);
        });
	    app.id("devicePlatform").addEventListener("click", function(){
            that._viewDevicePlatform.apply(that,arguments)
        });
        app.id("deviceUUID").addEventListener("click", function(){
            that._viewDeviceUUID.apply(that,arguments)
        });
        app.id("osVersion").addEventListener("click", function(){
            that._viewDeviceOSVersion.apply(that,arguments)
        });
        app.id("watchButton").addEventListener("click", function(){
            that._handleWatch.apply(that,arguments)
        });
        app.id("compassImage").style.display = "none";
    },
    
    _capturePhoto: function() {
        var that = this;
        that._clearLog();
        that._stopCompass();
        // Take picture using device camera and retrieve image as base64-encoded string.
        navigator.camera.getPicture(function(){
            that._onPhotoDataSuccess.apply(that,arguments);
        },function(){
            that._onFail.apply(that,arguments);
        },{
            quality: 50,
            destinationType: that._destinationType.DATA_URL
        });
    },
    
    _getPhotoFromLibrary: function() {
        var that= this;
        that._clearLog();
        that._stopCompass();
        // On Android devices, pictureSource.PHOTOLIBRARY and
        // pictureSource.SAVEDPHOTOALBUM display the same photo album.
        that._getPhoto(that._pictureSource.PHOTOLIBRARY);         
    },

    _getPhoto: function(source) {
        var that = this;
        // Retrieve image file location from specified source.
        navigator.camera.getPicture(function(){
            that._onPhotoURISuccess.apply(that,arguments);
        }, function(){
            app.cameraApp._onFail.apply(that,arguments);
        }, {
            quality: 50,
            destinationType: app.cameraApp._destinationType.FILE_URI,
            sourceType: source
        });
    },

    _scan: function() {
        var that= this;
        that._clearLog();
        that._stopCompass();
        cordova.plugins.barcodeScanner.scan(
                function(result) {
                    if (!result.cancelled) {
                        that._addMessageToLog(result.text);    
                    }
                }, 
                function(error) {
                    app.cameraApp._onFail.apply(that, "Quét thất bại: " + error);
                    //alert("Quét thất bại: " + error);
                });
    },

    _toggleFlashLight: function() {
        var that= this;
        that._clearLog();
        that._stopCompass();
        window.plugins.flashlight.available(function (isAvailable) {
            if (isAvailable) {
                // toggle on/off
                if (app.id("toggleFLButton").textContent === "Bật đèn Flash") {
                    app.id("toggleFLButton").textContent = "Tắt đèn Flash";
                }
                else {
                    app.id("toggleFLButton").textContent = "Bật đèn Flash";
                }
                window.plugins.flashlight.toggle(that._onSuccess, that._onError);
            }
            else {
                //alert("Thiết bị này không có đèn Flash.");
                app.cameraApp._onFail.apply(that, "Thiết bị này không có đèn Flash.");
            }
        });
    },

    _viewDeviceName : function() {
        var that= this;
        that._clearLog();
        that._stopCompass();
	    that._addMessageToLog(device.model);
	},
    
	_viewDevicePlatform : function () {
        var that= this;
        that._clearLog();
        that._stopCompass();
	    that._addMessageToLog(device.platform);
	},
    
	_viewDeviceUUID : function () {
        var that= this;
        that._clearLog();
        that._stopCompass();
	    that._addMessageToLog(device.uuid);
	},
    
	_viewDeviceOSVersion: function () {
        var that= this;
        that._clearLog();
        that._stopCompass();
		that._addMessageToLog(device.version);
	},

    _handleWatch: function() {
		var that = this;
        that._clearLog();
		button = app.id("watchButton");

		if (that.watchID !== null) {
			navigator.compass.clearWatch(that.watchID);
			that.watchID = null;
			button.innerHTML = "Bật la bàn";
            app.id("compassImage").style.display = "none";
		}
		else {
            app.id("compassImage").style.display = "";

			var options = { frequency: 1000 };

			that._addMessageToLog("Đang lấy dữ liệu từ la bàn...");
			button.innerHTML = "Tắt la bàn";
            
			that.watchID = navigator.compass.watchHeading(function() { 
				that._displayHeading.apply(that, arguments)
				that._rotateCompassImage.apply(that, arguments);
			}, 
														  function() {
															  that._onCompassWatchError.apply(that, arguments)
														  }, 
														  options);
		}
	},
    
	_displayHeading: function(heading) {
		var that = this,
		magneticHeading = heading.magneticHeading,
		timestamp = heading.timestamp;
        
		var informationMessage = 'Magnetic field: ' + magneticHeading + '<br />' +
								 'Timestamp: ' + timestamp + '<br />' 
        
        that._clearLog();
		that._addMessageToLog(informationMessage);
	},

    _rotateCompassImage : function(heading) {
		var compassDiv = app.id("compass"),
		magneticHeading = magneticHeading = 360 - heading.magneticHeading;
        
		var rotation = "rotate(" + magneticHeading + "deg)";
              
		compassDiv.style.webkitTransform = rotation;
	},

    _onCompassWatchError: function(error) {
		var that = this,
		errorMessage,
		button = app.id("watchButton");
		switch (error.code) {
			case 20:
				errorMessage = "Thiết bị không có la bàn.";
				break;
			case 0:
				errorMessage = "La bàn bị lỗi.";
				break;
			default:
				errorMessage = "La bàn bị lỗi.";
		}
        
		button.innerHTML = "Bật la bàn";
		that.watchID = null;
		that._clearLog();
		that._addMessageToLog(errorMessage);
	},

    _stopCompass: function() {
        var that = this,
        button = app.id("watchButton");
        if (that.watchID !== null) {
			navigator.compass.clearWatch(that.watchID);
			that.watchID = null;
			button.innerHTML = "Bật la bàn";
            app.id("compassImage").style.display = "none";
		}
    },

    _onSuccess: function() {
        
    },

    _onError: function () {
        
    },

    _addMessageToLog: function(text) {
        var that = this,
        currentMessage = that.resultsField.innerHTML,
        html = '<div class="row"><div class="col u-text-center"><span class="u-color-accent">' + text + '</span></div></div>';
		
        that.resultsField.innerHTML = currentMessage + html;
    },

    _clearLog: function() {
        var that = this;

        that.resultsField.innerHTML = '';
    },
    
    _onPhotoDataSuccess: function(imageData) {
        var smallImage = document.getElementById('smallImage');
        smallImage.style.display = 'block';
    
        // Show the captured photo.
        smallImage.src = "data:image/jpeg;base64," + imageData;
    },
    
    _onPhotoURISuccess: function(imageURI) {
        var smallImage = document.getElementById('smallImage');
        smallImage.style.display = 'block';
         
        // Show the captured photo.
        smallImage.src = imageURI;
    },
    
    _onFail: function(message) {
        //alert(message);
    }
}

    document.addEventListener("deviceready", function () {
        app.cameraApp = new app.cameraApp();
        app.cameraApp.run();

        navigator.splashscreen.hide();

        app.application = new kendo.mobile.Application(document.body, { layout: "tabstrip-layout" });
    }, false);
})(window);