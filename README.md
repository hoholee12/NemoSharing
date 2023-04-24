# NemoSharing
This work was supported by Institute of Information & communications Technology Planning & Evaluation(IITP) grant funded by the Korea government(MSIT) (No.2015-0-00284, (SW Starlab) Development of UX Platform Software for Supporting Concurrent Multi-users on Large Displays).

## Dependencies
 - NodeJS -v 14.17.0 
 - NPM -v 6.14.13
 - Ionic -v 6.16.2
 - NPX -v 6.14.13

## Installation & Build & Running

### Android:

1. Build the web application
```
$ npm install -g @ionic/cli
$ npm install -g @angular/core
$ npm install -g @capacitor/core
$ npm install -g @capacitor/camera
$ npm install -g @angular/platform-browser
$ cd NemoSharing
$ npm install
$ npm uninstall @ionic-native/geolocation --save
$ npm install @ionic-native/geolocation@5.27.0 --save
$ ionic build
$ npx cap sync
$ npx cap open android
```

2. Allow the following permissions in `manifest.xml`
```
<!-- Permissions -->

    <uses-permission android:name="android.permission.INTERNET" />

    <!-- Camera, Photos, input file -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
    <!-- Geolocation API -->
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-feature android:name="android.hardware.location.gps"/>
    <!-- Network API -->
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    <!-- Video -->
    <uses-permission android:name="android.permission.CAMERA"/>
    <!-- Audio -->
    <uses-permission android:name="android.permission.RECORD_AUDIO"/>
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
```

### NemoSharing_Server
NemoSharing_Server is a server-side component that communicates with the client using the sftp protocol. It launches an image viewer for any image files that have been transferred through the established connection.

Run NemoSharing_Server by:
```
cd NemoSharing_Server
sudo node index.js
```
The NemoSharing_Server program is designed to run only on the NEMOUX platform.

## Sources Used
### NemoSharing Server
* [asn1](https://github.com/TritonDataCenter/node-asn1) MIT License
* [core-util-is](https://github.com/isaacs/core-util-is) MIT License
* [isarray](https://github.com/juliangruber/isarray) MIT License
* [os-tmpdir](https://github.com/sindresorhus/os-tmpdir) MIT License
* [readable-stream](https://github.com/nodejs/readable-stream) MIT License
* [safer-buffer](https://github.com/ChALkeR/safer-buffer) MIT License
* [ssh2-streams](https://github.com/mscdex/ssh2-streams) MIT License
* [ssh2](https://github.com/mscdex/ssh2) MIT License
* [streamsearch](https://github.com/mscdex/streamsearch) MIT License
* [string_decoder](https://github.com/nodejs/string_decoder) MIT License
* [tmp](https://github.com/raszi/node-tmp) MIT License
* [inherits](https://github.com/isaacs/inherits) ISC License
* [semver](https://github.com/npm/node-semver) ISC License
* [node-sftp-server](https://github.com/validityhq/node-sftp-server) ISC License
* [npm](https://github.com/npm/cli) The Artistic License 2.0
### NemoSharing Client
* [android](https://www.android.com/) Apache License 2.0
* [Ionic Capacitor](https://github.com/ionic-team/capacitor) MIT License
* [AngularJS](https://github.com/angular/angular.js?) MIT License
* [piexifjs](https://github.com/hMatoba/piexifjs) MIT License

## Contact Information
Please contact us at <ins>`hoholee12@gmail.com`</ins> with any questions.
