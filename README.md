Virus Path Tracer &middot; [Mobile App] - [DOWNLOAD APK](https://github.com/migastone/pathtracer-app/raw/master/platforms/android/app/build/outputs/apk/debug/app-debug.apk "DOWNLOAD APK")
===========================================================================

[![](https://github.com/migastone/pathtracer-app/raw/master/docs_images/logo.jpg)](https://www.migastone.com/)

-------------------------------------------------------------------------------

Project developed from MIGAWIN SRL - SAN MARINO ([www.migawin.com](https://www.migawin.com "www.migawin.com"))  a technological startup founded from [Migastone](https://www.migastone.com/ "Migastone")

-------------------------------------------------------------------------------

Path tracer is an *App* for **iPhone** and **Android** useful to trace and analyze the interaction of people during a time frame of *past 30 days*.

The App is able to warn if a user was physically near another user marked as **infected**.

The data collection is made anonymous by using the **UUID** of each phone, this allow to keep the *privacy* of each user monitored.

**NOTE: This is app part of the project. For server part visit the [server](https://github.com/migastone/pathtracer-server "server") repository.**

----------------------------------------------------------------------------
![App Screenshots](https://github.com/migastone/pathtracer-app/raw/master/docs_images/app_poster.png)

----------------------------------------------------------------------------
![App Status Screenshots](https://github.com/migastone/pathtracer-app/raw/master/docs_images/app_statuses.png)

----------------------------------------------------------------------------
[![Download Android APK](https://github.com/migastone/pathtracer-app/raw/master/docs_images/android_download_poster.png)](https://github.com/migastone/pathtracer-app/raw/master/platforms/android/app/build/outputs/apk/debug/app-debug.apk)

Technical Details
===========================================================================

## Installation

### Step 1: Start by cloning this repo

```bash
$ git clone https://github.com/migastone/pathtracer-app.git
```

----------------------------------------------------------------------------

### Step 2:  Building and Running the Ionic 1 App

```bash
$ npm install

$ npm install -g cordova ionic # you should have ionic and cordova installed

$ ionic cordova platform add android
$ ionic cordova build android --apk

$ ionic cordova platform add ios
$ ionic cordova build ios

// Browser (not recomended)
$ ionic cordova serve  
```

## Configurations

### js/config.js

```Javascript
angular
  .module("virus_path_tracer.config", [])
  // URL of the API server
  .constant("API_URL", "https://SERVER_URL/api/") 
  // API token key on server
  .constant("API_TOKEN_KEY", "TOKEN_KEY") //e.g. abc123hudes12AB
   // API token value of server
  .constant("API_TOKEN", "TOKEN_KEY_VALUE") //e.g. D25412B9-BCC4-4444-BE3C-3D7ADCA3590A
  // after how many minutes we record a location locally in SQLite database (if there is a location)
  .constant("LOCAL_DB_ENTRY_MINUTES", 15) 
  // after how many minutes we sync all locations to API server database (if there is a location)
  .constant("API_DB_ENTRY_MINUTES", 60)
  // icon used for showing push notifications
  .constant("PUSH_ICON", "https://SERVER_URL/public/images/push_icon.png");
```
## SQLite Database Settings

### js/app.js

```Javascript
try {
  db = $cordovaSQLite.openDB({
    name: "vptdbasefinalversion.db", // database name
    location: "default",
    androidDatabaseProvider: "system",
    androidLockWorkaround: 1
  });
} catch (error) {
    alert(error);
}
$cordovaSQLite.execute( //device table
  db,
  "CREATE TABLE IF NOT EXISTS device (id INTEGER PRIMARY KEY, country TEXT, platform TEXT, uuid TEXT, version TEXT, manufacturer TEXT, is_infected INTEGER DEFAULT 0, infected_marked_by TEXT, infected_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)"
);
$cordovaSQLite.execute( //ledgers table
  db,
  "CREATE TABLE IF NOT EXISTS ledgers (id INTEGER PRIMARY KEY, latitude TEXT, longitude TEXT, status INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP)"
).then(function(unique_index) {
  $cordovaSQLite.execute( //unique index on date for duplicate entries
    db,
    "CREATE UNIQUE INDEX IF NOT EXISTS UniqueCreatedAt ON ledgers (created_at)"
  );
}, function(error) {});
```

## Other Important Files & Settings

### js/controllers.js
The app consist of 2 main *controllers* which includes `RegistrationController` for managing *registration-related* activities for new users and seconds one is `StatusController` which does many things such as:

+ Displaying current status
+ Updating own status (if enabled from API server)
+ Syncing with API server (both manual and forced)
+ Push notifications

```Javascript
angular.module("virus_path_tracer.controllers", [])

  .controller("RegistrationController", function ($cordovaLocalNotification, $scope, $ionicLoading, $cordovaSQLite, $state, $cordovaDevice, $ionicPlatform, Location, Dialog, PUSH_ICON, Registration) { ....... })
  
  .controller("StatusController", function ($scope, $ionicLoading, $cordovaSQLite, $cordovaLocalNotification, $ionicPlatform, $ionicPopup, $cordovaDevice, $timeout, $q, API_TOKEN, PUSH_ICON, LOCAL_DB_ENTRY_MINUTES, API_DB_ENTRY_MINUTES, Dialog, Status) { ....... });
```

We are using [`cordova-background-geolocation`](https://github.com/transistorsoft/cordova-background-geolocation "`cordova-background-geolocation`") for managing the fetching the background geolocation. You can update the settings to suites your needs.

```Javascript
bgGeo.ready({
  reset: true,
  debug: true, // disable it if you feel annoyed with the location detection sound
  distanceFilter: 10,
  stopOnTerminate: false,
  startOnBoot: true,
  enableHeadless: true
}, function (state) {
  if (!state.enabled) {
    bgGeo.start();
  }
});
```

### js/factories.js
The app consist of 2 main *factories* which includes `Registration` and `Status` which works with respected controllers having same names.

```Javascript
angular.module("virus_path_tracer.factories", [])

  .factory("Registration", function($http, $cordovaDevice, API_URL, API_TOKEN) { ....... })
  
  .factory("Status", function($http, $cordovaDevice, API_URL, API_TOKEN) { ....... });
```

### views/registration.html & views/status.html
The app consist of 2 *views* which includes `registration.html` and `status.html` which works with respected code related files having same names.

```html
<ion-view class="registration-view" cache-view="false"> 
  ....... 
</ion-view>

<ion-view class="status-view" cache-view="false"> 
  ....... 
</ion-view>
```

**IMPORTANT:** These components used are subjected to an LTU license to be used, please contact the copywright owners to acquire the license to use in your own project:
+ `cordova-background-geolocation`