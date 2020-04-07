angular.module("virus_path_tracer.controllers", [])
  .controller("RegistrationController", function ($cordovaLocalNotification, $scope, $ionicLoading, $cordovaSQLite, $state, $cordovaDevice, $ionicPlatform, Location, Dialog, PUSH_ICON, Registration) {

    $scope.settings = {};
    $scope.page_title = 'Virus Path Tracer';
    $ionicLoading.show({
      template: '<ion-spinner icon="spiral"></ion-spinner>'
    });

    $scope.loadContent = function() {
      if(window.cordova) {
        $cordovaSQLite.execute(db, "SELECT * FROM device").then(
          function(res) {
            if (res.rows.length > 0) {
              $state.go("status");
            } else {
              $scope.loadGeoLocation();
            }
          },
          function(error) {
            $scope.startUpCheck(
              5,
              "SELECT device table error: " + error.message + "."
            );
          }
        );
      } else {
        $scope.loadGeoLocation();
      }
    };

    $scope.loadGeoLocation = function() {
      Location.getLocation().then(
        function(position) {
          $scope.startUpCheck(232, "");
          $scope.page_title = "Registration";
          Registration.load()
            .success(function(data) {
              $scope.settings = data.data;
              $scope.settings.is_terms_accepted = null;
              $scope.settings.uuid = $cordovaDevice.getUUID();
              $scope.settings.country = null;
              $scope.settings.latitude = position.coords.latitude;
              $scope.settings.longitude = position.coords.longitude;
            })
            .finally(function() {
              if($scope.settings.registration_is_video_enabled == "1" && $scope.settings.registration_youtube_url) {
                $scope.$on("youtube.player.ready", function($event, player) {
                  $scope.initAll();
                });
              } else {
                $scope.initAll();
              }
            });
        },
        function(error) {
          $scope.startUpCheck(3, error);
          $ionicLoading.hide();
        }
      );
    };

    $scope.initAll = function() {
      $ionicLoading.hide();
      if(window.cordova) {
        bgGeo.ready({
          reset: true,
          debug: true,
          distanceFilter: 10,
          stopOnTerminate: false,
          startOnBoot: true,
          enableHeadless: true
        }, function (state) {
          if (!state.enabled) {
            bgGeo.start();
          }
        });
        if ($scope.settings.registration_is_welcome_push_enabled == "1") {
          $cordovaLocalNotification.schedule({
            id: Math.floor(100000 + Math.random() * 900000),
            title: $scope.settings.registration_welcome_push_title,
            text: $scope.settings.registration_welcome_push_text,
            icon: PUSH_ICON,
            foreground: true
          });
        }
      }
    };

    $scope.registerMe = function() {
      $ionicLoading.show({
        template: '<ion-spinner icon="spiral"></ion-spinner>'
      });
      $scope.settings.device_timezone = $scope.getLocalTimezone();
      Registration.registerMe($scope.settings)
        .success(function(data) {
          if (data.error && !data.data) {
            Dialog.alert("Error", data.error, "OK");
          } else {
            $scope.device_info = data.data;
            var message = "Registration process completed successfully.";
            if (data.error) {
              message = data.error;
              $cordovaSQLite.execute(db, "DELETE FROM device");
              $cordovaSQLite.execute(db, "DELETE FROM ledgers");
            }
            Dialog.alert("Success", message, "OK");
            $cordovaSQLite
              .execute(
                db,
                "INSERT INTO device (country, platform, uuid, version, manufacturer) VALUES (?,?,?,?,?)",
                [
                  $scope.device_info.country.toString(),
                  $scope.device_info.platform.toString(),
                  $scope.device_info.uuid.toString(),
                  $scope.device_info.version.toString(),
                  $scope.device_info.manufacturer.toString()
                ]
              )
              .then(
                function(res) {
                  if (res.insertId > 0 && res.rowsAffected > 0) {
                    $cordovaSQLite
                      .execute(
                        db,
                        "INSERT INTO ledgers (latitude, longitude, status) VALUES (?,?,?)",
                        [
                          $scope.device_info.latitude.toString(),
                          $scope.device_info.longitude.toString(),
                          1
                        ]
                      )
                      .then(
                        function(res) {
                          if (res.insertId > 0 && res.rowsAffected > 0) {
                            $state.go("status");
                          } else {
                            $scope.startUpCheck(
                              5,
                              "INSERT in ledgers table failed."
                            );
                          }
                        },
                        function(error) {
                          $scope.startUpCheck(
                            5,
                            "INSERT ledgers table error: " +
                              error.message +
                              "."
                          );
                        }
                      );
                  } else {
                    $scope.startUpCheck(5, "INSERT in device table failed.");
                  }
                },
                function(error) {
                  $scope.startUpCheck(
                    5,
                    "INSERT device table error: " + error.message + "."
                  );
                }
              );
          }
        })
        .finally(function() {
          $ionicLoading.hide();
        });
    };

    $scope.startUpCheck = function(message_id, error) {
      switch (message_id) {
        case 1:
          $scope.info_title = "Location Service";
          $scope.info_message = "This app requires that the location setting is always enabled. Please enable it and restart the app.";
          $scope.has_location = null;
          $ionicLoading.hide();
          break;
        case 2:
          $scope.info_title = "Location Service";
          $scope.info_message = "The following error occurred: " + error + '.';
          $scope.has_location = null;
          break;
        case 3:
          $scope.info_title = "Location Permission";
          $scope.info_message = "You need to share your location in order to use this app. The following error occurred: " + error.message + ".";
          $scope.has_location = null;
        case 4:
          $scope.has_location = null;
          $ionicLoading.hide();
          break;
        case 5:
          $scope.info_title = "SQLite Database";
          $scope.info_message = error + '.';
          $scope.has_location = null;
          $ionicLoading.hide();
        default:
          $scope.has_location = true;
          $scope.info_title = '';
      }
    };

    $scope.getLocalTimezone = function () {
      var local_timezone = "";
      var extra_zero = "";
      var offset = new Date().getTimezoneOffset();
      if (offset < 0) {
        var extra_zero = "";
        if (-offset % 60 < 10)
          extra_zero = "0";

        local_timezone = "+" + Math.ceil(offset / -60) + ":" + extra_zero + (-offset % 60);
      } else {
        if (offset % 60 < 10)
          extra_zero = "0";

        local_timezone = "-" + Math.floor(offset / 60) + ":" + extra_zero + (offset % 60);
      }

      return local_timezone;
    };

    $ionicPlatform.ready(function() {
      if(window.cordova) {
        cordova.plugins.diagnostic.isLocationEnabled(
          function(enabled) {
            if (enabled) {
              $scope.loadContent();
            } else {
              $scope.startUpCheck(1, "");
            }
          },
          function(error) {
            $scope.startUpCheck(2, error);
          }
        );

        cordova.plugins.diagnostic.registerLocationStateChangeHandler(function(state){
          if(
            (
              $cordovaDevice.getPlatform() === "Android" &&
              state !== cordova.plugins.diagnostic.locationMode.LOCATION_OFF
            ) ||
            (
              $cordovaDevice.getPlatform().platform === "iOS"
            ) &&
            (
              state === cordova.plugins.diagnostic.permissionStatus.GRANTED ||
              state === cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE
            )
          ){
            $scope.loadContent();
          } else {
            $scope.startUpCheck(1, "");
            $cordovaLocalNotification.schedule({
              id: Math.floor(100000 + Math.random() * 900000),
              title: "Diagnostic Service",
              text: "This app requires that the location setting is always enabled. Please enable it and restart the app.",
              icon: PUSH_ICON,
              foreground: true
            });
          }
        });
      } else {
        $scope.loadContent();
      }
    });

  })
  .controller("StatusController", function ($scope, $ionicLoading, $cordovaSQLite, $cordovaLocalNotification, $ionicPlatform, $ionicPopup, $cordovaDevice, $timeout, $q, API_TOKEN, PUSH_ICON, LOCAL_DB_ENTRY_MINUTES, API_DB_ENTRY_MINUTES, Dialog, Status) {

    $scope.device_info = {};
    $scope.page_title = "Status";
    $scope.info_title = null;
    $scope.has_ledger = null;
    $scope.has_not_synced = null;
    $scope.is_syncing = null;

    $scope.loadContent = function() {
      $cordovaSQLite.execute(db, "SELECT is_infected, infected_marked_by, DATETIME(infected_at, 'localtime') AS infected_at_date FROM device WHERE id = 1").then(
        function(res) {
          if (res.rows.length > 0) {
            Status.myStatus()
              .success(function(data) {
                if(!data.error) {
                  $scope.device_info = data.data;
                  $scope.device_info.is_infected_local = res.rows.item(0).is_infected;
                  $scope.device_info.infected_marked_by_local = res.rows.item(0).infected_marked_by;
                  $scope.device_info.infected_at_local = res.rows.item(0).infected_at_date;
                  if($scope.device_info.is_send_push) {
                    $cordovaLocalNotification.schedule({
                      id: Math.floor(100000 + Math.random() * 900000),
                      title: $scope.device_info.status_title,
                      text: $scope.device_info.status_text,
                      icon: PUSH_ICON,
                      foreground: true
                    });
                    $scope.device_info.is_send_push = null;
                  }
                  //$scope.deleteOldLedgers();
                  //$scope.loadLedgers();
                } else {
                  $scope.info_title = "API Server";
                  $scope.info_message = data.error;
                }
              })
              .finally(function() {
                $ionicLoading.hide();
              });
          } else {
            $ionicLoading.hide();
            $scope.info_title = "SQLite Database";
            $scope.info_message = "No device data found.";
          }
        },
        function(error) {
          $ionicLoading.hide();
          $scope.info_title = "SQLite Database";
          $scope.info_message = "SELECT device table error: " + error.message + ".";
        }
      );
    };

    $scope.loadLedgers = function() {
      $scope.ledgers = [];
      $cordovaSQLite.execute(db, "SELECT id, latitude, longitude, status, DATETIME(created_at, 'localtime') AS record_time FROM ledgers WHERE 1 ORDER BY DATETIME(created_at) DESC LIMIT 30").then(
        function(res) {
          if (res.rows.length > 0) {
            $scope.has_ledger = true;
            for (var index = 0; index < res.rows.length; index++) {
              if(!$scope.has_not_synced && res.rows.item(index).status != 1) {
                $scope.has_not_synced = true;
              }
              $scope.ledgers.push({
                latitude: res.rows.item(index).latitude,
                longitude: res.rows.item(index).longitude,
                status: res.rows.item(index).status == 1 ? "Yes" : "No",
                created_at: res.rows.item(index).record_time
              });
            }
          }
        },
        function(error) {
          $scope.info_title = "SQLite Database";
          $scope.info_message = "SELECT ledgers table error: " + error.message + ".";
        }
      );
    };

    $scope.deleteOldLedgers = function() {
      $cordovaSQLite
        .execute(
          db,
          "DELETE FROM ledgers WHERE DATE(created_at) <= date('now','-30 day')"
        )
        .then(
          function(deletion) {
          },
          function(error) {
          }
        );
    };

    $scope.syncLedgers = function() {
      $ionicPopup.confirm({
        title: "Confirmation",
        template: "Do you confirm you want to force server sync?"
      }).then(function(result) {
        if (result) {
          $scope.is_syncing = true;
          $ionicLoading.show({
            template: '<ion-spinner icon="spiral"></ion-spinner>'
          });
          $cordovaSQLite
            .execute(db, "SELECT id, latitude, longitude, status, DATETIME(created_at, 'localtime') AS device_created_at FROM ledgers WHERE status <> 1")
            .then(
              function(res) {
                $scope.ledger_posts = [];
                var local_time_zone = $scope.getLocalTimezone();
                for (var index = 0; index < res.rows.length; index++) {
                  $scope.ledger_posts.push({
                    'latitude': res.rows.item(index).latitude,
                    'longitude': res.rows.item(index).longitude,
                    'device_timezone': local_time_zone,
                    'device_created_at': res.rows.item(index).device_created_at
                  });
                  $cordovaSQLite.execute(db, "UPDATE ledgers SET status = ? WHERE id = ?", [1, res.rows.item(index).id]);
                }
                Status.saveLedger({
                  'o4FLb6OWVq6vXgaes1zNS0NDKhQM44': API_TOKEN,
                  'uuid': $cordovaDevice.getUUID(),
                  'ledger_posts': JSON.stringify($scope.ledger_posts)
                })
                .success(function(data) {
                  if(!data.error) {
                    $scope.deleteOldLedgers();
                    $scope.loadLedgers();
                    $scope.device_info.status_title = data.data.status_title;
                    $scope.device_info.status_text = data.data.status_text;
                    $scope.device_info.status_class = data.data.status_class;
                    $scope.device_info.can_update_status = data.data.can_update_status;
                    $scope.device_info.is_send_push = data.data.is_send_push;
                    if($scope.device_info.is_send_push) {
                      $cordovaLocalNotification.schedule({
                        id: Math.floor(100000 + Math.random() * 900000),
                        title: $scope.device_info.status_title,
                        text: $scope.device_info.status_text,
                        icon: PUSH_ICON,
                        foreground: true
                      });
                      $scope.device_info.is_send_push = null;
                    }
                    Dialog.alert(
                      "API Server",
                      "The data is successfully synced with API server.",
                      "OK"
                    );
                  } else {
                    Dialog.alert(
                      "API Server",
                      data.error,
                      "OK"
                    );
                  }
                })
                .finally(function() {
                  $ionicLoading.hide();
                  $scope.has_not_synced = null;
                  $scope.is_syncing = null;
                });
              },
              function(error) {
                $ionicLoading.hide();
                $scope.has_not_synced = null;
                $scope.is_syncing = null;
                Dialog.alert(
                  "SQLite Database",
                  "SELECT ledgers table error: " + error.message + ".",
                  "OK"
                );
              }
            );
        }
      });
    };

    $scope.imInfected = function(status_code) {
      $ionicPopup.confirm({
        title: "Confirmation",
        template: status_code == 1 ? "Are you sure to mark you infected? The information will be anonymous and will generate a warning to the users that are near your position. Please proceed only if you are sure!" : "Are you sure to mark you not infected?"
      }).then(function(result) {
        if (result) {
          $scope.is_syncing = true;
          $ionicLoading.show({
            template: '<ion-spinner icon="spiral"></ion-spinner>'
          });
          $cordovaSQLite.execute(db, "UPDATE device SET is_infected = ?, infected_marked_by = ?, infected_at = DATETIME('now') WHERE id = ?", [status_code, 'Self', 1]).then(
            function(update_device) {
              $cordovaSQLite
                .execute(
                  db,
                  "SELECT is_infected, infected_marked_by, DATETIME(infected_at, 'localtime') AS device_infected_at FROM device WHERE id = 1"
                )
                .then(
                  function(device_date) {
                    Status.updateStatus({
                      'o4FLb6OWVq6vXgaes1zNS0NDKhQM44': API_TOKEN,
                      'uuid': $cordovaDevice.getUUID(),
                      'is_infected': status_code,
                      'infected_marked_by': 'Self',
                      'device_infected_at': device_date.rows.item(0).device_infected_at
                    })
                    .success(function(data) {
                      if(!data.error) {
                        $scope.device_info.is_infected_local = device_date.rows.item(0).is_infected;
                        $scope.device_info.infected_marked_by_local = device_date.rows.item(0).infected_marked_by;
                        $scope.device_info.infected_at_local = device_date.rows.item(0).device_infected_at;
                        $scope.device_info.status_title = data.data.status_title;
                        $scope.device_info.status_text = data.data.status_text;
                        $scope.device_info.status_class = data.data.status_class;
                        $scope.device_info.can_update_status = data.data.can_update_status;
                        $scope.device_info.is_send_push = data.data.is_send_push;
                        $cordovaLocalNotification.schedule({
                          id: Math.floor(100000 + Math.random() * 900000),
                          title: $scope.device_info.status_title,
                          text: $scope.device_info.status_text,
                          icon: PUSH_ICON,
                          foreground: true
                        });
                        Dialog.alert(
                          "API Server",
                          "Status has been updated successfully.",
                          "OK"
                        );
                      } else {
                        Dialog.alert(
                          "API Server",
                          data.error,
                          "OK"
                        );
                      }
                    })
                    .finally(function() {
                      $ionicLoading.hide();
                      $scope.is_syncing = null;
                    });
                  },
                  function(error) {
                    $ionicLoading.hide();
                    $scope.is_syncing = null;
                    Dialog.alert(
                      "SQLite Database",
                      "SELECT device table error: " + error.message + ".",
                      "OK"
                    );
                  }
                );
            },
            function(error) {
              $ionicLoading.hide();
              $scope.is_syncing = null;
              Dialog.alert(
                "SQLite Database",
                "UPDATE device table error: " + error.message + ".",
                "OK"
              );
            }
          );
        }
      });
    };

    $scope.backgroundFailure = function(error) {
      var message = 'Unknown error.';
      switch (error) {
        case 0:
          message = "Location unknown.";
          break;
        case 1:
          message = "Location permission denied.";
          break;
        case 2:
          message = "Network error.";
          break;
        case 408:
          message = "Location timeout.";
          break;
      }
      $cordovaLocalNotification.schedule({
        id: Math.floor(100000 + Math.random() * 900000),
        title: "Background Location Service",
        text: message,
        icon: PUSH_ICON,
        foreground: true
      });
    };

    $scope.backgroundTask = function(location) {
      var defer = $q.defer();
      //Dialog.alert("backgroundTask", "Line 538","OK");
      $cordovaSQLite
        .execute(
          db,
          "SELECT DATETIME(created_at, 'localtime') AS last_time FROM ledgers WHERE id = (SELECT MAX(id) FROM ledgers)"
        )
        .then(
          function(last) {
            if (last.rows.length > 0) {
              var sqlite_date = last.rows.item(0).last_time;
              var sqlite_js_date = new Date(
                Date.parse(sqlite_date.replace(/[-]/g, "/"))
              );
              var minutes_diff = $scope.diffMinutes(new Date(), sqlite_js_date);
              if (minutes_diff >= LOCAL_DB_ENTRY_MINUTES) {
                cordova.plugins.diagnostic.isLocationEnabled(
                  function(enabled) {
                    if (enabled) {
                      $cordovaSQLite
                        .execute(
                          db,
                          "INSERT INTO ledgers (latitude, longitude, status) VALUES (?,?,?)",
                          [
                            location.coords.latitude.toString(),
                            location.coords.longitude.toString(),
                            0
                          ]
                        )
                        .then(
                          function(res) {
                            $cordovaSQLite.execute(
                              db,
                              "DELETE l1 FROM ledgers l1 INNER JOIN ledgers l2 WHERE l1.id < l2.id AND strftime('%Y-%m-%d %H:%M', l1.created_at) = strftime('%Y-%m-%d %H:%M', l2.created_at)"
                            );
                            if (res.insertId > 0 && res.rowsAffected > 0) {
                              defer.resolve({title: "", message: ""});
                              //Dialog.alert("backgroundTask", "Line 570","OK");
                              //$scope.bgServerSync();
                            } else {
                              /*$cordovaLocalNotification.schedule({
                                id: Math.floor(100000 + Math.random() * 900000),
                                title: "SQLite Database",
                                text: "INSERT in ledgers table failed.",
                                icon: PUSH_ICON,
                                foreground: true
                              });*/
                              defer.reject({title: "SQLite Database", message: "INSERT in ledgers table failed."});
                              //Dialog.alert("backgroundTask", "Line 581","OK");
                            }
                          },
                          function(error) {
                            /*$cordovaLocalNotification.schedule({
                              id: Math.floor(100000 + Math.random() * 900000),
                              title: "SQLite Database",
                              text: "INSERT ledgers table error: " + error.message + ".",
                              icon: PUSH_ICON,
                              foreground: true
                            });*/
                            defer.reject({title: "", message: ""});
                            //Dialog.alert("backgroundTask", "Line 593","OK");
                          }
                        );
                    } else {
                      /*$cordovaLocalNotification.schedule({
                        id: Math.floor(100000 + Math.random() * 900000),
                        title: "Location Service",
                        text:
                          "This app requires that the location setting is always enabled. Please enable it and restart the app.",
                        icon: PUSH_ICON,
                        foreground: true
                      });*/
                      defer.reject({title: "Location Service", message: "This app requires that the location setting is always enabled. Please enable it and restart the app."});
                      //Dialog.alert("backgroundTask", "Line 606","OK");
                    }
                  },
                  function(error) {
                    /*$cordovaLocalNotification.schedule({
                      id: Math.floor(100000 + Math.random() * 900000),
                      title: "Location Service",
                      text: "The following error occurred: " + error + ".",
                      icon: PUSH_ICON,
                      foreground: true
                    });*/
                    defer.reject({title: "Location Service", message: "The following error occurred: " + error + "."});
                    //Dialog.alert("backgroundTask", "Line 618","OK");
                  }
                );
              } else {
                defer.resolve({title: "", message: ""});
                //Dialog.alert("backgroundTask", "Line 623","OK");
              }
            } else {
              defer.reject({title: "SQLite Database", message: "No data in local ledgers table."});
              //Dialog.alert("backgroundTask", "Line 627","OK");
            }
          },
          function(error) {
            /*$cordovaLocalNotification.schedule({
              id: Math.floor(100000 + Math.random() * 900000),
              title: "SQLite Database",
              text: "SELECT ledgers table error: " + error.message + ".",
              icon: PUSH_ICON,
              foreground: true
            });*/
            defer.reject({title: "SQLite Database", message: "SELECT ledgers table error: " + error.message + "."});
            //Dialog.alert("backgroundTask", "Line 639","OK");
          }
        );

      return defer.promise;
    };

    $scope.bgServerSync = function() {
      var defer = $q.defer();
      //Dialog.alert("bgServerSync", "Line 648","OK");
      $cordovaSQLite
        .execute(
          db,
          "SELECT id, latitude, longitude, status, DATETIME(created_at, 'localtime') AS device_created_at FROM ledgers WHERE status <> 1 ORDER BY id"
        )
        .then(
          function(res) {
            if (res.rows.length > 0) {
              $cordovaSQLite
                .execute(
                  db,
                  "SELECT DATETIME(created_at, 'localtime') AS last_time FROM ledgers WHERE status <> 1 ORDER BY id LIMIT 1"
                )
                .then(
                  function(last_not_synced) {
                    var sqlite_date_api = last_not_synced.rows.item(0)
                      .last_time;
                    var sqlite_js_date_api = new Date(
                      Date.parse(sqlite_date_api.replace(/[-]/g, "/"))
                    );
                    var minutes_diff_api = $scope.diffMinutes(
                      new Date(),
                      sqlite_js_date_api
                    );
                    if (minutes_diff_api >= API_DB_ENTRY_MINUTES) {
                      var local_time_zone = $scope.getLocalTimezone();
                      $scope.ledger_posts = [];
                      for (var index = 0; index < res.rows.length; index++) {
                        $scope.ledger_posts.push({
                          latitude: res.rows.item(index).latitude,
                          longitude: res.rows.item(index).longitude,
                          device_timezone: local_time_zone,
                          device_created_at: res.rows.item(index).device_created_at
                        });
                        $cordovaSQLite.execute(
                          db,
                          "UPDATE ledgers SET status = ? WHERE id = ?",
                          [1, res.rows.item(index).id]
                        );
                      }
                      Status.saveLedger({
                        o4FLb6OWVq6vXgaes1zNS0NDKhQM44: API_TOKEN,
                        uuid: $cordovaDevice.getUUID(),
                        ledger_posts: JSON.stringify($scope.ledger_posts)
                      })
                        .success(function(data) {
                          if (!data.error) {
                            $scope.device_info.status_title =
                              data.data.status_title;
                            $scope.device_info.status_text =
                              data.data.status_text;
                            $scope.device_info.status_class =
                              data.data.status_class;
                            $scope.device_info.can_update_status =
                              data.data.can_update_status;
                            $scope.device_info.is_send_push =
                              data.data.is_send_push;
                            if ($scope.device_info.is_send_push) {
                              $cordovaLocalNotification.schedule({
                                id: Math.floor(100000 + Math.random() * 900000),
                                title: $scope.device_info.status_title,
                                text: $scope.device_info.status_text,
                                icon: PUSH_ICON,
                                foreground: true
                              });
                              $scope.device_info.is_send_push = null;
                            }

                            /*$cordovaLocalNotification.schedule({
                              id: Math.floor(100000 + Math.random() * 900000),
                              title: "API Server",
                              text:
                                "The data is successfully synced with API server.",
                              icon: PUSH_ICON,
                              foreground: true
                            });*/
                            defer.resolve({title: "API Server", message: "The data is successfully synced with API server."});
                            //Dialog.alert("bgServerSync", "Line 725","OK");
                          } else {
                            /*$cordovaLocalNotification.schedule({
                              id: Math.floor(100000 + Math.random() * 900000),
                              title: "API Server",
                              text: data.error,
                              icon: PUSH_ICON,
                              foreground: true
                            });*/
                            defer.reject({title: "API Server", message: data.error});
                            //Dialog.alert("bgServerSync", "Line 735","OK");
                          }
                        })
                        .finally(function() {});
                    } else {
                      defer.resolve({title: "", message: ""});
                      //Dialog.alert("bgServerSync", "Line 741","OK");
                    }
                  },
                  function(error) {
                    /*$cordovaLocalNotification.schedule({
                      id: Math.floor(100000 + Math.random() * 900000),
                      title: "SQLite Database",
                      text:
                        "SELECT ledgers table error: " + error.message + ".",
                      icon: PUSH_ICON,
                      foreground: true
                    });*/
                    defer.reject({title: "SQLite Database", message: "SELECT ledgers table error: " + error.message + "."});
                    //Dialog.alert("bgServerSync", "Line 751","OK");
                  }
                );
            } else {
              defer.resolve({title: "", message: ""});
              //Dialog.alert("bgServerSync", "Line 756","OK");
            }
          },
          function(error) {
            /*$cordovaLocalNotification.schedule({
              id: Math.floor(100000 + Math.random() * 900000),
              title: "SQLite Database",
              text: "SELECT ledgers table error: " + error.message + ".",
              icon: PUSH_ICON,
              foreground: true
            });*/
            defer.reject({title: "SQLite Database", message: "SELECT ledgers table error: " + error.message + "."});
            //Dialog.alert("bgServerSync", "Line 768","OK");
          }
        );

        return defer.promise;
    };

    $scope.myStatusSync = function() {
      Status.myStatus()
      .success(function(data) {
        if(!data.error) {
          $scope.device_info = data.data;
          if($scope.device_info.is_send_push) {
            $cordovaLocalNotification.schedule({
              id: Math.floor(100000 + Math.random() * 900000),
              title: $scope.device_info.status_title,
              text: $scope.device_info.status_text,
              icon: PUSH_ICON,
              foreground: true
            });
            $scope.device_info.is_send_push = null;
          }
        } else {
          $scope.info_title = "API Server";
          $scope.info_message = data.error;
          $cordovaLocalNotification.schedule({
            id: Math.floor(100000 + Math.random() * 900000),
            title: $scope.info_title,
            text: $scope.info_message,
            icon: PUSH_ICON,
            foreground: true
          });
        }
      })
      .finally(function() {
      });
    };

    $scope.locationCheck = function() {
      cordova.plugins.diagnostic.isLocationEnabled(
        function(enabled) {
          if (enabled) {
            $scope.loadContent();
          } else {
            $scope.info_title = "Location Service";
            $scope.info_message = "This app requires that the location setting is always enabled. Please enable it and restart the app.";
          }
        },
        function(error) {
          $scope.info_title = "Location Service";
          $scope.info_message = "The following error occurred: " + error + '.';
        }
      );
    };

    $scope.notifyUser = function(title, text) {
      if(title != "" && text != "") {
        $cordovaLocalNotification.schedule({
          id: Math.floor(100000 + Math.random() * 900000),
          title: title,
          text: text,
          icon: PUSH_ICON,
          foreground: true
        });
      }
    }

    $scope.diffMinutes = function(date_two, date_one) {
      var diff = (date_two.getTime() - date_one.getTime()) / 1000;
      diff /= 60;
      return Math.abs(Math.round(diff));
    };

    $scope.getLocalTimezone = function () {
      var local_timezone = "";
      var extra_zero = "";
      var offset = new Date().getTimezoneOffset();
      if (offset < 0) {
        var extra_zero = "";
        if (-offset % 60 < 10)
          extra_zero = "0";

        local_timezone = "+" + Math.ceil(offset / -60) + ":" + extra_zero + (-offset % 60);
      } else {
        if (offset % 60 < 10)
          extra_zero = "0";

        local_timezone = "-" + Math.floor(offset / 60) + ":" + extra_zero + (offset % 60);
      }

      return local_timezone;
    };

    $scope.getFormattedDate = function (cdate) {
      var todayTime = new Date(cdate);
      var month = todayTime.getMonth() + 1;
      var day = todayTime.getDate();
      var year = todayTime.getFullYear();
      var hour = todayTime.getHours();
      var minute = todayTime.getMinutes();
      if (month < 10)
        month = '0' + month;
      if (day < 10)
        day = '0' + day;
      if (hour < 10)
        hour = "0" + hour;
      if (minute < 10)
        minute = "0" + minute;
      return day + "/" + month + "/" + year + " " + hour + ":" + minute;
    }

    $ionicPlatform.ready(function() {
      $scope.locationCheck();
      //$scope.bgServerSync();

      cordova.plugins.diagnostic.registerLocationStateChangeHandler(function(state){
        if(
          (
            $cordovaDevice.getPlatform() === "Android" &&
            state !== cordova.plugins.diagnostic.locationMode.LOCATION_OFF
          ) ||
          (
            $cordovaDevice.getPlatform().platform === "iOS"
          ) &&
          (
            state === cordova.plugins.diagnostic.permissionStatus.GRANTED ||
            state === cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE
          )
        ){
          $scope.locationCheck();
          $scope.deleteOldLedgers();
          $scope.loadLedgers();
          //$scope.bgServerSync();
          $scope.myStatusSync();
        } else {
          $scope.info_title = "Location Service";
          $scope.info_message = "This app requires that the location setting is always enabled. Please enable it and restart the app.";
          $cordovaLocalNotification.schedule({
            id: Math.floor(100000 + Math.random() * 900000),
            title: "Diagnostic Service",
            text: "This app requires that the location setting is always enabled. Please enable it and restart the app.",
            icon: PUSH_ICON,
            foreground: true
          });
        }
      });

      bgGeo.onLocation(
        location => {
          $scope.backgroundTask(location).then(function(bg_object) {
            var defer = $q.defer();
            $scope.bgServerSync().then(function (ss_object) {
              defer.resolve('');
              $scope.notifyUser(ss_object.title, ss_object.message);
              //Dialog.alert("onLocation", "Line 885","OK");
            }, function (ss_object) {
              defer.reject('');
              $scope.notifyUser(ss_object.title, ss_object.message);
              //Dialog.alert("onLocation", "Line 889","OK");
            }).finally(function () {
              defer.resolve('');
              $scope.deleteOldLedgers();
              $scope.loadLedgers();
              $scope.myStatusSync();
              //Dialog.alert("onLocation", "Line 895","OK");
            });
            $scope.notifyUser(bg_object.title, bg_object.message);
            //Dialog.alert("onLocation", "Line 898","OK");
            return defer.promise;
          }, function(bg_object) {
            $scope.notifyUser(bg_object.title, bg_object.message);
            //Dialog.alert("onLocation", "Line 902","OK");
          }).finally(function() {
            //Dialog.alert("onLocation", "Line 904","OK");
          });
        },
        error => {
          $scope.backgroundFailure(error);
        }
      );

      bgGeo.changePace(true);

      bgFetch.configure(
        function (taskId) {
          bgGeo.changePace(true);
          BackgroundFetch.finish(taskId);
        },
        function (error) {
          $scope.notifyUser("BackgroundFetch Failed", error);
        },
        {
          minimumFetchInterval: 15,
          stopOnTerminate: false,
          startOnBoot: true,
          enableHeadless: true
        }
      );

    });

  });
