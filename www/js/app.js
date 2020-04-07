// VirusPathTracer App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var db = null; //global database instance
var bgGeo = null; //global background location instance
var bgFetch = null; //global background fetch instance
angular.element(document).ready(function() {
  if (window.cordova) {
    console.log(
      "Running in Cordova, will bootstrap AngularJS once 'deviceready' event fires."
    );
    document.addEventListener(
      "deviceready",
      function() {
        console.log("Deviceready event has fired, bootstrapping AngularJS.");
        angular.bootstrap(document.body, ["virus_path_tracer"]);
      },
      false
    );
  } else {
    console.log("Running in browser, bootstrapping AngularJS now.");
    angular.bootstrap(document.body, ["virus_path_tracer"]);
  }
});
angular
  .module("virus_path_tracer", [
    "ionic",
    "virus_path_tracer.controllers",
    "virus_path_tracer.directives",
    "virus_path_tracer.filters",
    "virus_path_tracer.services",
    "virus_path_tracer.factories",
    "virus_path_tracer.config",
    "ngCordova",
    "youtube-embed"
  ])
  .run(function($ionicPlatform, $cordovaSQLite) {
    $ionicPlatform.ready(function() {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs).
      // The reason we default this to hidden is that native apps don't usually show an accessory bar, at
      // least on iOS. It's a dead giveaway that an app is using a Web View. However, it's sometimes
      // useful especially with forms, though we would prefer giving the user a little more room
      // to interact with the app.
      if (window.cordova && window.Keyboard) {
        window.Keyboard.hideKeyboardAccessoryBar(true);
      }

      if (window.StatusBar) {
        // Set the statusbar to use the default style, tweak this to
        // remove the status bar on iOS or change it to use white instead of dark colors.
        StatusBar.styleDefault();
      }

      //create the database and table
      if(window.cordova) {
        try {
          db = $cordovaSQLite.openDB({
            name: "vptdbasefinalversion.db",
            location: "default",
            androidDatabaseProvider: "system",
            androidLockWorkaround: 1
          });
        } catch (error) {
          alert(error);
        }
        $cordovaSQLite.execute(
          db,
          "CREATE TABLE IF NOT EXISTS device (id INTEGER PRIMARY KEY, country TEXT, platform TEXT, uuid TEXT, version TEXT, manufacturer TEXT, is_infected INTEGER DEFAULT 0, infected_marked_by TEXT, infected_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)"
        );
        $cordovaSQLite.execute(
          db,
          "CREATE TABLE IF NOT EXISTS ledgers (id INTEGER PRIMARY KEY, latitude TEXT, longitude TEXT, status INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP)"
        ).then(
          function(unique_index) {
            $cordovaSQLite.execute(
              db,
              "CREATE UNIQUE INDEX IF NOT EXISTS UniqueCreatedAt ON ledgers (created_at)"
            );
          },
          function(error) {
          }
        );
        bgGeo = window.BackgroundGeolocation;
        bgFetch = window.BackgroundFetch;
      }
    });
  })
  .config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state("registration", {
        cache: false,
        url: "/registration",
        templateUrl: "views/registration.html",
        controller: "RegistrationController"
      })
      .state("status", {
        cache: false,
        url: "/status",
        templateUrl: "views/status.html",
        controller: "StatusController"
      });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise("/registration");
  });
