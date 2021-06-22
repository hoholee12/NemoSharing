# NemoSharing
This work was supported by Institute of Information & communications Technology Planning & Evaluation(IITP) grant funded by the Korea government(MSIT) (IITP-2015-0-00284, (SW Starlab) Development of UX Platform Software for Supporting Concurrent Multi-users on Large Displays)

## Dependencies
NodeJS -v 14.17.0 

NPM -v 6.14.13

Ionic -v 6.16.2

NPX -v 6.14.13

## Installation & Bluild & Running

Using Browser:

```
$ npm install -g @ionic/cli
$ npm install -g @angular/core
$ npm install -g @capacitor/core
$ npm install -g @capacitor/camera
$ npm install -g @angular/platform-browser
$ cd NemoSeamless-demo
$ ionic integrations enable capacitor
$ npx cap init
$ ionic build
$ npx cap add android
$ npm install @ionic/pwa-elements
$ ionic build
$ npx cap sync
$ ionic serve --external
```


Using Android:

1. Build Web Application
```
$ npm install -g @ionic/cli
$ npm install -g @angular/core
$ npm install -g @capacitor/core
$ npm install -g @capacitor/camera
$ npm install -g @angular/platform-browser
$ cd NemoSeamless-demo
$ ionic integrations enable capacitor
$ npx cap init
$ ionic build
$ npx cap add android
$ npm install @ionic/pwa-elements
$ ionic build
$ npx cap sync
$ npx cap open android
```

2. Allow Permission in `menifest.xml`
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

---
## Contact

Please contact us at `hoholee12@naver.com` with any questions.
