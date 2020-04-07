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