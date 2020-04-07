angular
  .module("virus_path_tracer.services", [])
  .service('Location', function ($cordovaGeolocation, $q) {
    var service = {
        lastFetch: null,
        position: null
    };

    /**
     * Default timeout is 10 seconds
     *
     * @param config
     * @param force
     * @returns {*|promise}
     */
    service.getLocation = function (config, force) {
        var deferred = $q.defer();
        var isResolved = false;

        var localForce = (force !== undefined);

        var localConfig = angular.extend(
          {
            timeout: 5000,
            enableHighAccuracy: true,
            maximumAge: 5000
          },
          config
        );

        if (!localForce && (service.lastFetch !== null) && ((service.lastFetch + 42000) > Date.now())) {
            console.log("send immediate value, then repoll in background: ", Date.now(), service.position);
            // fresh poll, send direct
            deferred.resolve(service.position);
            isResolved = true;
        }

        $cordovaGeolocation.getCurrentPosition(localConfig).then(
          function(position) {
            console.log("repoll location service: ", Date.now(), position);
            service.lastFetch = Date.now();
            service.position = position;
            if (!isResolved) {
              deferred.resolve(service.position);
            }
          },
          function(err) {
            console.log("repoll location service: ", Date.now(), "ERRORRRRRr");
            if (!isResolved) {
              deferred.reject(err);
            }
          }
        );

        return deferred.promise;
    };

    /**
     * Returns the latest fetch position, if there is one, or false
     *
     * @returns {null}
     */
    service.getLatest = function () {
        var deferred = $q.defer();

        if (service.lastFetch === null) {
            // Try to fetch it!
            service.getLocation()
                .then(function (position) {
                    deferred.resolve(position);
                }, function () {
                    deferred.reject(false);
                });
        } else {
            deferred.resolve(service.position);
        }

        return deferred.promise;
    };

    return service;
  })
  .service("Dialog", function($ionicPopup, $timeout, $q) {
    var service = {
      is_open: false,
      stack: []
    };

    /**
     * Un stack popups on event
     */
    service.unStack = function() {
      service.is_open = false;

      if (service.stack.length >= 1) {
        $timeout(function() {
          var dialog = service.stack.shift();

          switch (dialog.type) {
            case "alert":
              service.renderAlert(dialog.data);
              break;
            case "prompt":
              service.renderPrompt(dialog.data);
              break;
            case "confirm":
              service.renderConfirm(dialog.data);
              break;
            case "ionicPopup":
              service.renderIonicPopup(dialog.data);
              break;
          }
        }, 250);
      }
    };

    /**
     *
     * @param title
     * @param message
     * @param button
     * @param dismiss if -1 dismiss duration will be automatically calculated.
     * @returns {*}
     */
    service.alert = function(title, message, button, dismiss) {
      var deferred = $q.defer();

      /** Stack alert */
      service.stack.push({
        type: "alert",
        data: {
          title: title,
          message: message,
          button: button,
          dismiss: dismiss,
          promise: deferred
        }
      });

      if (service.stack.length === 1 && !service.is_open) {
        service.unStack();
      }

      return deferred.promise;
    };

    /**
     * @param data
     */
    service.renderAlert = function(data) {
      service.is_open = true;

      var alertPromise = null;

      var message = data.title;
      var cssClass = data.title === "" ? "popup-no-title" : "";

      alertPromise = $ionicPopup.alert({
        title: data.title,
        template: data.message,
        cssClass: cssClass,
        okText: data.button
      });

      data.promise.resolve(alertPromise);

      alertPromise.then(function() {
        service.unStack();
      });

      if (typeof data.dismiss === "number") {
        /**
         * -1 means automatic calculation
         */
        var duration = data.dismiss;
        if (data.dismiss === -1) {
          duration = Math.min(Math.max(message.length * 50, 2000), 7000) + 400;
        }

        $timeout(function() {
          alertPromise.close();
        }, duration);
      }
    };

    /**
     *
     * @param title
     * @param message
     * @param type
     * @param value
     */
    service.prompt = function(title, message, type, value) {
      var deferred = $q.defer();

      var localType = type === undefined ? "text" : type;
      var localValue = value === undefined ? "" : value;

      /** Stack alert */
      service.stack.push({
        type: "prompt",
        data: {
          title: title,
          message: message,
          type: localType,
          value: localValue,
          promise: deferred
        }
      });

      if (service.stack.length === 1 && !service.is_open) {
        service.unStack();
      }

      return deferred.promise;
    };

    /**
     * @param data
     */
    service.renderPrompt = function(data) {
      service.is_open = true;

      var cssClass = data.title === "" ? "popup-no-title" : "";

      return $ionicPopup
        .prompt({
          title: data.title,
          template: data.message,
          okText: data.button,
          cssClass: cssClass,
          inputType: data.type,
          inputPlaceholder: data.value
        })
        .then(function(result) {
          if (result === undefined) {
            data.promise.reject(result);
          } else {
            data.promise.resolve(result);
          }

          service.unStack();
        });
    };

    /**
     * @param message
     * @param title
     * @param buttonsArray - ex: ['Ok', 'Cancel']
     * @param cssClass
     *
     * @returns Integer: 0 - no button, 1 - button 1, 2 - button 2
     */
    service.confirm = function(title, message, buttonsArray, cssClass) {
      var deferred = $q.defer();

      /** Stack alert */
      service.stack.push({
        type: "confirm",
        data: {
          title: title,
          message: message,
          buttons_array: buttonsArray,
          css_class: cssClass,
          promise: deferred
        }
      });

      if (service.stack.length === 1 && !service.is_open) {
        service.unStack();
      }

      return deferred.promise;
    };

    /**
     * @param data
     *
     * @return Promise
     */
    service.renderConfirm = function(data) {
      service.is_open = true;

      var cssClass = data.title === "" ? "popup-no-title" : "";

      return $ionicPopup
        .confirm({
          title: data.title,
          cssClass: data.css_class + " " + cssClass,
          template: data.message,
          okText: data.buttons_array[0],
          cancelText: data.buttons_array[1]
        })
        .then(function(result) {
          data.promise.resolve(result);
          service.unStack();
        });
    };

    /**
     * @param config
     *
     * @return Promise
     */
    service.ionicPopup = function(config) {
      var deferred = $q.defer();

      /** Stack alert */
      service.stack.push({
        type: "ionicPopup",
        data: {
          config: config,
          promise: deferred
        }
      });

      if (service.stack.length === 1 && !service.is_open) {
        service.unStack();
      }

      return deferred.promise;
    };

    /**
     * @param data
     *
     * @return Promise
     */
    service.renderIonicPopup = function(data) {
      service.is_open = true;

      return $ionicPopup.show(data.config).then(function(result) {
        data.promise.resolve(result);
        service.unStack();
      });
    };

    return service;
  });
