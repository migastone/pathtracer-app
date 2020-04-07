Virus Path Tracer &middot; [Mobile App]
===========================================================================

[![](https://d1aettbyeyfilo.cloudfront.net/migastone/3216354_1548953319823Logo_Migastone_blue400px.png)](https://www.migastone.com/)

-------------------------------------------------------------------------------
Path tracer is an *App* for **iPhone** and **Android** useful to trace and analyze the interaction of people during a time frame of *past 30 days*.

The App is able to warn if a user was physically near another user marked as **infected**.

The data collection is made anonymous by using the **UUID** of each phone, this allow to keep the *privacy* of each user monitored.

**NOTE: This is app part of the project. For server part visit the [server](https://github.com/migastone/pathtracer-server "server") repository.**

----------------------------------------------------------------------------
[![Download Android APK](https://github.com/migastone/pathtracer-app/raw/master/docs_images/app_poster.png)](https://github.com/migastone/pathtracer-app/raw/master/platforms/android/app/build/outputs/apk/debug/app-debug.apk)

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
  .constant("API_URL", "https://api.viruspathtracer.com/api/") 
  // API token key on server
  .constant("API_TOKEN_KEY", "o4FLb6OWVq6vXgaes1zNS0NDKhQM44") 
   // API token value of server
  .constant("API_TOKEN", "C23412B9-ADC4-4438-BE3C-3D7ADCA3541D")
  // after how many minutes we record a location locally in SQLite database (if there is a location)
  .constant("LOCAL_DB_ENTRY_MINUTES", 15) 
  // after how many minutes we sync all locations to API server database (if there is a location)
  .constant("API_DB_ENTRY_MINUTES", 60)
  // icon used for showing push notifications
  .constant("PUSH_ICON", "https://api.viruspathtracer.com/assets/img/push_icon.png");
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
		//device table
        $cordovaSQLite.execute(
          db,
          "CREATE TABLE IF NOT EXISTS device (id INTEGER PRIMARY KEY, country TEXT, platform TEXT, uuid TEXT, version TEXT, manufacturer TEXT, is_infected INTEGER DEFAULT 0, infected_marked_by TEXT, infected_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)"
        );
		//ledgers table
        $cordovaSQLite.execute(
          db,
          "CREATE TABLE IF NOT EXISTS ledgers (id INTEGER PRIMARY KEY, latitude TEXT, longitude TEXT, status INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP)"
        ).then(
          function(unique_index) {
		   //unique index on date for duplicate entries
            $cordovaSQLite.execute(
              db,
              "CREATE UNIQUE INDEX IF NOT EXISTS UniqueCreatedAt ON ledgers (created_at)"
            );
          },
          function(error) {
          }
        );
```