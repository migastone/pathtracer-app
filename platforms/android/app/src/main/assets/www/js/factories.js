angular
  .module("virus_path_tracer.factories", [])
  .factory("Registration", function($http, $cordovaDevice, API_URL, API_TOKEN) {
    var factory = {};

    factory.load = function() {
      return $http({
        method: "GET",
        url: API_URL + "settings",
        params: {
          'o4FLb6OWVq6vXgaes1zNS0NDKhQM44': API_TOKEN
        },
        cache: false,
        responseType: "json"
      });
    };

    factory.registerMe = function(settings) {
      return $http({
        method: "GET",
        url: API_URL + "register_me",
        params: {
          'o4FLb6OWVq6vXgaes1zNS0NDKhQM44': API_TOKEN,
          'country': settings.country,
          'latitude': settings.latitude,
          'longitude': settings.longitude,
          'platform': $cordovaDevice.getPlatform(),
          'uuid': $cordovaDevice.getUUID(),
          'version': $cordovaDevice.getVersion(),
          'manufacturer': $cordovaDevice.getManufacturer(),
          'device_timezone': settings.device_timezone
        },
        cache: false,
        responseType: "json"
      });
    };

    return factory;
  })
  .factory("Status", function($http, $cordovaDevice, API_URL, API_TOKEN) {
    var factory = {};

    factory.saveLedger = function(ledgers) {
      return $http({
        method: "GET",
        url: API_URL + "save_ledger",
        params: ledgers,
        cache: false,
        responseType: "json"
      });
    };

    factory.myStatus = function() {
      return $http({
        method: "GET",
        url: API_URL + "my_status",
        params: {
          'o4FLb6OWVq6vXgaes1zNS0NDKhQM44': API_TOKEN,
          'uuid': $cordovaDevice.getUUID()
        },
        cache: false,
        responseType: "json"
      });
    };

    factory.updateStatus = function(status_data) {
      return $http({
        method: "GET",
        url: API_URL + "update_status",
        params: status_data,
        cache: false,
        responseType: "json"
      });
    };

    return factory;
  });
