import { Component, ɵSafeResourceUrl } from '@angular/core';
import { Capacitor, Plugins } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, FilesystemDirectory, Encoding, Directory } from '@capacitor/filesystem';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { Geolocation } from '@ionic-native/geolocation';
import { Platform, ModalController } from '@ionic/angular';

import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { FileChooser } from '@ionic-native/file-chooser/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';

declare var window: any;

declare var piexif: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  private file: File;
  
  public geolat = "";
  public geolong = "";
  public datetime = "";
  public geoerror = "";
  public lat: number;
  public long: number;
  public mtime: number;

  seamlessMode: boolean;
  photo: SafeResourceUrl;
  
  public path = "";
  
  public sftp: any;

  constructor(private sanitizer: DomSanitizer, private http: HttpClient, private platform: Platform, private diagnostic: Diagnostic, private fileChooser: FileChooser, private filePath: FilePath) {
    this.sftp = new window.JJsftp('115.145.170.225', '8022', 'nemoux', 'nemoux');
    this.locate();  //due to async, geolocation may not be updated in time.
  }


  //for browser
  locate(){
    if(this.diagnostic.isLocationAuthorized() && this.diagnostic.isLocationAvailable()){
       this.platform.ready().then(()=>{
        Geolocation.watchPosition({enableHighAccuracy: true}).subscribe((pos)=>{
          this.lat = pos.coords.latitude;
          this.long = pos.coords.longitude;
          this.geolat = "latitude: " + pos.coords.latitude;
          this.geolong = "longitude: " + pos.coords.longitude;
        });
          
        this.datetime = new Date().toDateString();  
      });
    }
    else{
      this.lat = 1234;
      this.long = 1234;
      this.geolat = "latitude: not authorized?";
      this.geolong = "longitude: not authorized?";
    }
  }

  async dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1]);
  
    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
  
    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
  
    // create a view into the buffer
    var ia = new Uint8Array(ab);
  
    // set the bytes of the buffer to the correct values
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
  
    // write the ArrayBuffer to a blob, and you're done
    var blob = new Blob([ab], {type: mimeString});
    return blob;
  
  }
  
  isChecked() {
    console.log('State:' + this.seamlessMode);
  	if(this.seamlessMode) this.geoerror = 'upload checked';

    /* TODO: Add transmission code (seamlessMode == true) */
  }
  
 
  async base64FromPath(path: string): Promise<string> {
    const response = await fetch(path);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject('method did not return a string')
        }
      };
      reader.readAsDataURL(blob);
    });
  }

  batchUpload(){
    var count = 0;
    var total = 0;
    
    Filesystem.readdir({path: '', directory: Directory.Documents}).then((result)=>{
      result.files.forEach((value)=>{
        total++;
        /*
        Filesystem.getUri({path:value, directory: Directory.Documents}).then((result)=>{
          this.path = result.uri.replace('file://', '');
          
        })
        */
        
       Filesystem.readFile({path: value, directory: Directory.Documents}).then((result)=>{
        
        var exifObj = piexif.load(atob(result.data));
                
        //1. photo taken in range of 0.0000005 lat/long
        var latoff = Math.floor(this.lat * 10000000) - Math.floor(piexif.GPSHelper.dmsRationalToDeg(exifObj["GPS"][piexif.GPSIFD.GPSLatitude]) * 10000000);
        var longoff = Math.floor(this.long * 10000000) - Math.floor(piexif.GPSHelper.dmsRationalToDeg(exifObj["GPS"][piexif.GPSIFD.GPSLongitude]) * 10000000);
                
        if(latoff < 10000 && latoff > -10000 && longoff < 10000 && longoff > -10000){
          //2. photo taken in under 5 minutes
          Filesystem.stat({path: value, directory: Directory.Documents}).then((result)=>{
            var mtimeoff = this.mtime - result.mtime;
			//this.geoerror = 'target:' + this.mtime + 'compare:' + result.mtime;
            if(mtimeoff < 10000 && mtimeoff > -10000){  //TODO: this.mtime
              //do it!
              count++;
			  
              this.geoerror = "sent: " + count + " files out of: " + total + " files total";
              Filesystem.getUri({path:value, directory: Directory.Documents}).then((result)=>{
                this.path = result.uri.replace('file://', '');
                
                this.sftp.upload('/home/nemoux/ftpclient/destination/', this.path, (good)=>{}, (bad)=>{});
              });
              
            }
            
          })  
        }
        
       })
        
        
      })
    })
    
  }

  takePhoto(myCameraSource: CameraSource){
    if(this.platform.is('android')){
      const options = {
        quality: 60,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: myCameraSource,
	    	format: "jpeg",
			correctOrientation: true
      };
      if(myCameraSource == CameraSource.Photos){
        this.fileChooser.open().then((url)=>{
          this.filePath.resolveNativePath(url).then((fpath)=>{
            var filename = fpath.split('\\').pop().split('/').pop(); //filename only
            this.geoerror = 'filename:' + filename;
            Filesystem.readFile({path: filename, directory: Directory.Documents}).then((result)=>{
              //display as base64
              var str = "data:image/jpeg;base64," + result.data;
              this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(str);

              //get the target exif
              var exifObj = piexif.load(atob(result.data));
              this.lat = piexif.GPSHelper.dmsRationalToDeg(exifObj["GPS"][piexif.GPSIFD.GPSLatitude]);
              this.long = piexif.GPSHelper.dmsRationalToDeg(exifObj["GPS"][piexif.GPSIFD.GPSLongitude]);
              Filesystem.stat({path: filename, directory: Directory.Documents}).then((result)=>{
                this.mtime = result.mtime;
                this.batchUpload(); //premigration
              })
            })
            
          })
        })
      }
      else{
        const fileName = new Date().getTime() + ".jpeg";
        Camera.getPhoto(options).then((image)=>{
          this.locate();
          this.base64FromPath(image.webPath).then((base64Data)=>{
            var exifObj = piexif.load(base64Data);
            if(! exifObj["GPS"][piexif.GPSIFD.GPSLatitude]){
            
              exifObj["GPS"][piexif.GPSIFD.GPSLatitudeRef] = this.lat < 0 ? 'S' : 'N';
              exifObj["GPS"][piexif.GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDmsRational(this.lat);
              exifObj["GPS"][piexif.GPSIFD.GPSLongitudeRef] = this.long < 0 ? 'W' : 'E';
              exifObj["GPS"][piexif.GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDmsRational(this.long);
              var exifbytes = piexif.dump(exifObj);
              var base64Data = piexif.insert(exifbytes, base64Data) + ''; //workaround type check
            }
            this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(base64Data);
            
            Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: Directory.Documents
            }).then((result)=>{
              if(this.seamlessMode){
                this.path = result.uri.replace('file://', '');
                
                this.sftp.upload('/home/nemoux/ftpclient/destination/', this.path, (good)=>{}, (bad)=>{});
                
              }
            })

          });

        });
      }
    }
    else{
      const options = {
        quality: 60,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: myCameraSource,
	    	format: "jpeg",
			correctOrientation: true
      };
      const fileName = new Date().getTime() + ".jpeg";
      Camera.getPhoto(options).then((image)=>{
        
        this.path = image.webPath;
        this.geoerror = this.path;
          
        this.base64FromPath(image.webPath).then((base64Data)=>{
          var exifObj = piexif.load(base64Data);
          
          if(! exifObj["GPS"][piexif.GPSIFD.GPSLatitude]){
          
            exifObj["GPS"][piexif.GPSIFD.GPSLatitudeRef] = this.lat < 0 ? 'S' : 'N';
            exifObj["GPS"][piexif.GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDmsRational(this.lat);
            exifObj["GPS"][piexif.GPSIFD.GPSLongitudeRef] = this.long < 0 ? 'W' : 'E';
            exifObj["GPS"][piexif.GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDmsRational(this.long);
            var exifbytes = piexif.dump(exifObj);
            var base64Data = piexif.insert(exifbytes, base64Data) + ''; //workaround type check
          }
          this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(base64Data);
          this.geoerror = 'this is it' + base64Data;
          if(this.seamlessMode){
            this.dataURItoBlob(base64Data).then((photoBlob)=>{

              let formData = new FormData();
              formData.append("file", photoBlob, fileName);
              
              this.http.post("http://115.145.170.217:3000/upload", formData).subscribe((response)=>{ console.log(response)});
            });
    
          }
        });
        
        
        
      });

      
            
    }
  }
  
  takePicture() {
    
    this.takePhoto(CameraSource.Camera);
    
  }

  takeGallery() {
    this.takePhoto(CameraSource.Photos);
    
  }
  
  
}