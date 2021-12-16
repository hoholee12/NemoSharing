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

//for cordova plugins.
//look into plugin.xml 'clobbers' tag for var name

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

  //latency check
  public displayLatency1 = '';
  public displayLatency2 = '';
  public displayLatency3 = '';
  public displayLatency4 = '';
  public displayLatency5 = '';
  public displayLatency6 = '';
  public latencyHtml: number;
  public latencyExif: number;
  public latencyTofile: number;
  public latencyFromfile: number;
  public latencyDecode: number;
  public latencyBatch: number;
  public latencySingle: number;

  seamlessMode: boolean;
  photo: SafeResourceUrl;
  
  public path = "";
  
  public sftp: any;

  constructor(private sanitizer: DomSanitizer, private http: HttpClient, private platform: Platform, private diagnostic: Diagnostic, private fileChooser: FileChooser, private filePath: FilePath) {
    
    this.locate();  //due to async, geolocation may not be updated in time.
  }


  //for browser(deprecated)
  //use with ssl disabled.
  locate(){
    if(this.diagnostic.isLocationAuthorized() && this.diagnostic.isLocationAvailable()){
       this.platform.ready().then(()=>{
        Geolocation.watchPosition({enableHighAccuracy: true}).subscribe((pos)=>{
          this.lat = pos.coords.latitude;
          this.long = pos.coords.longitude;
          this.geolat = "latitude: " + pos.coords.latitude;
          this.geolong = "longitude: " + pos.coords.longitude;
        });

        this.updatedatetime();
      });
    }
    else{
      this.lat = 1234;
      this.long = 1234;
      this.geolat = "latitude: not authorized?";
      this.geolong = "longitude: not authorized?";
    }
  }

  updatedatetime(){
    var date = new Date();
    this.datetime = date.getFullYear() + ':' + ('0' + date.getMonth()).slice(-2) + ':' + ('0' + date.getDay()).slice(-2) + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getDay()).slice(-2);
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

  delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  
  public uplist:{remote: string, local: string}[] = [];
  batchUpload(){
    var count = 0;
    var total = 0;

    var dirlatency = new Date().getTime();  //dir latency
    Filesystem.readdir({path: '', directory: Directory.Documents}).then((result)=>{
      dirlatency = new Date().getTime() - dirlatency; //dir latency

      this.uplist = [];
      
      var counter = result.files.length;
      
      result.files.forEach((value, idx)=>{
        total++;
          /*
          Filesystem.getUri({path:value, directory: Directory.Documents}).then((result)=>{
            this.path = result.uri.replace('file://', '');
            
          })
          */

        var filelatency = new Date().getTime(); //file latency
        Filesystem.readFile({path: value, directory: Directory.Documents}).then((result)=>{
          filelatency = new Date().getTime() - filelatency; //file latency
          if(this.latencyFromfile > filelatency) this.latencyFromfile = filelatency;
          
          //get the target exif
          //base64 to binary conversion==============
          this.latencyDecode = new Date().getTime();
          //=========================================
          var convertedData = atob(result.data);
          //base64 to binary conversion==============
          this.latencyDecode = new Date().getTime() - this.latencyDecode;
          //=========================================

          //parsing exif from data===================
          this.latencyExif = new Date().getTime();
          //=========================================
          var exifObj = piexif.load(convertedData);

          //1. photo taken in range of 0.0000005 lat/long
          var latoff = Math.floor(this.lat * 10000000) - Math.floor(piexif.GPSHelper.dmsRationalToDeg(exifObj["GPS"][piexif.GPSIFD.GPSLatitude]) * 10000000);
          var longoff = Math.floor(this.long * 10000000) - Math.floor(piexif.GPSHelper.dmsRationalToDeg(exifObj["GPS"][piexif.GPSIFD.GPSLongitude]) * 10000000);
          var parsetime:string = exifObj["GPS"][piexif.GPSIFD.GPSDateStamp];
          var resultmtime = 
            parseInt(parsetime.split(' ')[0].split(':')[0]) * 365 * 31 * 24 * 60  +
            parseInt(parsetime.split(' ')[0].split(':')[1]) * 31 * 24 * 60 +
            parseInt(parsetime.split(' ')[0].split(':')[2]) * 24 * 60 +
            parseInt(parsetime.split(' ')[1].split(':')[0]) * 60 +
            parseInt(parsetime.split(' ')[1].split(':')[1]);
          //parsing exif from data===================
          this.latencyExif = new Date().getTime() - this.latencyExif;
          //=========================================

          if(latoff < 10000 && latoff > -10000 && longoff < 10000 && longoff > -10000){
            //2. photo taken in under 5 minutes
            var mtimeoff = this.mtime - resultmtime;

            if(mtimeoff < 5 && mtimeoff > -5){  //TODO: this.mtime
              count++;
          
              Filesystem.getUri({path:value, directory: Directory.Documents}).then((result)=>{
                this.path = result.uri.replace('file://', '');
                this.uplist.push({remote: '/opt/contents/default/media/pct/news/', local: this.path});
                
                setTimeout(() => {
                  counter -= 1;
                  if(counter === (total - count)){  //last index
                    
                    this.geoerror = "sent: " + count + " files out of: " + total + " files total";

                    
                    //batch upload latency=====================
                    this.latencyBatch = new Date().getTime() - this.latencyBatch;
                    //=========================================

                    
                    this.sftp = new window.JJsftp('115.145.170.225', '8022', 'nemoux', 'nemoux');
                    this.sftp.uploadList(this.uplist, (success)=>{
                      
                      //display result===========================
                      this.displayLatency1 = 'html:' + this.latencyHtml + 'msec';
                      this.displayLatency2 = 'readdir:' + dirlatency + 'msec';
                      this.displayLatency3 = 'readfile:' + this.latencyFromfile + 'msec';
                      this.displayLatency4 = 'exif:' + this.latencyExif + 'msec';
                      this.displayLatency5 = 'decode:' + this.latencyDecode + 'msec';
                      this.displayLatency6 = 'batch:' + this.latencyBatch + 'msec';
                      //=========================================
                    }, (fail)=>{


                    });
                  
                  }   
                });
                
                
              })
              
            }
            

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
          //batch upload latency=====================
          this.latencyBatch = new Date().getTime();
          //=========================================
          this.filePath.resolveNativePath(url).then((fpath)=>{
            var filename = fpath.split('\\').pop().split('/').pop(); //filename only
            this.geoerror = 'filename:' + filename;

            //from reading data to html================
            this.latencyHtml = new Date().getTime();
            //=========================================
            //read from storage========================
            this.latencyFromfile = new Date().getTime();
            //=========================================

            Filesystem.readFile({path: filename, directory: Directory.Documents}).then((result)=>{
              //read from storage========================
              this.latencyFromfile = new Date().getTime() - this.latencyFromfile;
              //=========================================

              //display as base64
              var str = "data:image/jpeg;base64," + result.data;
              this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(str);
              
              //from reading data to html================
              this.latencyHtml = new Date().getTime() - this.latencyHtml;
              //=========================================

              
              //get the target exif
              //base64 to binary conversion==============
              this.latencyDecode = new Date().getTime();
              //=========================================
              var convertedData = atob(result.data);
              //base64 to binary conversion==============
              this.latencyDecode = new Date().getTime() - this.latencyDecode;
              //=========================================

              //parsing exif from data===================
              this.latencyExif = new Date().getTime();
              //=========================================
              var exifObj = piexif.load(convertedData);
              this.lat = piexif.GPSHelper.dmsRationalToDeg(exifObj["GPS"][piexif.GPSIFD.GPSLatitude]);
              this.long = piexif.GPSHelper.dmsRationalToDeg(exifObj["GPS"][piexif.GPSIFD.GPSLongitude]);
              var parsetime:string = exifObj["GPS"][piexif.GPSIFD.GPSDateStamp];
              this.mtime = 
                parseInt(parsetime.split(' ')[0].split(':')[0]) * 365 * 31 * 24 * 60  +
                parseInt(parsetime.split(' ')[0].split(':')[1]) * 31 * 24 * 60 +
                parseInt(parsetime.split(' ')[0].split(':')[2]) * 24 * 60 +
                parseInt(parsetime.split(' ')[1].split(':')[0]) * 60 +
                parseInt(parsetime.split(' ')[1].split(':')[1]);
              //parsing exif from data===================
              this.latencyExif = new Date().getTime() - this.latencyExif;
              //=========================================
              
              this.batchUpload(); //premigration

            })
            
          })
        })
      }
      else{
        const fileName = new Date().getTime() + ".jpeg";
        Camera.getPhoto(options).then((image)=>{
          this.locate();

          //from reading data to html================
          this.latencyHtml = new Date().getTime();
          //=========================================

          //single upload latency=====================
          this.latencySingle = new Date().getTime();
          //=========================================

          this.base64FromPath(image.webPath).then((base64Data)=>{

            this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(base64Data);

            //from reading data to html================
            this.latencyHtml = new Date().getTime() - this.latencyHtml;
            //=========================================

            //parsing exif from data===================
            this.latencyExif = new Date().getTime();
            //=========================================

            var exifObj = piexif.load(base64Data);
            if(! exifObj["GPS"][piexif.GPSIFD.GPSLatitude]){
            
              exifObj["GPS"][piexif.GPSIFD.GPSLatitudeRef] = this.lat < 0 ? 'S' : 'N';
              exifObj["GPS"][piexif.GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDmsRational(this.lat);
              exifObj["GPS"][piexif.GPSIFD.GPSLongitudeRef] = this.long < 0 ? 'W' : 'E';
              exifObj["GPS"][piexif.GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDmsRational(this.long);
              exifObj["GPS"][piexif.GPSIFD.GPSDateStamp] = this.datetime;
              var exifbytes = piexif.dump(exifObj);
              var base64Data = piexif.insert(exifbytes, base64Data) + ''; //workaround type check
            }

            //parsing exif from data===================
            this.latencyExif = new Date().getTime() - this.latencyExif;
            //=========================================
            
            //write to storage=========================
            this.latencyTofile = new Date().getTime();
            //=========================================

            Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: Directory.Documents
            }).then((result)=>{
              
              //write to storage=========================
              this.latencyTofile = new Date().getTime() - this.latencyTofile;
              //=========================================

              if(this.seamlessMode){
                this.path = result.uri.replace('file://', '');

                
                //single upload latency=====================
                this.latencySingle = new Date().getTime() - this.latencySingle;
                //=========================================

                this.sftp = new window.JJsftp('115.145.170.225', '8022', 'nemoux', 'nemoux');
                this.sftp.upload('/opt/contents/default/media/pct/news/', this.path, (good)=>{
                  
                  //display result===========================
                  this.displayLatency1 = 'html:' + this.latencyHtml + 'msec';
                  this.displayLatency2 = 'exif:' + this.latencyExif + 'msec';
                  this.displayLatency3 = 'persist:' + this.latencyTofile + 'msec';
                  this.displayLatency4 = 'single:' + this.latencySingle + 'msec';
                  //=========================================

                }, (bad)=>{});
                
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

  initlatencycheck(){
    this.latencyHtml = -1;
    this.latencyExif = -1;
    this.latencyTofile = -1;
    this.latencyFromfile = -1;
    this.latencyBatch = -1;
    this.latencySingle = -1;
    this.geoerror = "";
    this.displayLatency1 = '';
    this.displayLatency2 = '';
    this.displayLatency3 = '';
    this.displayLatency4 = '';
    this.displayLatency5 = '';
    this.displayLatency6 = '';
    
  }

  takePicture() {
    this.updatedatetime();
    this.initlatencycheck();
    this.takePhoto(CameraSource.Camera);
    
  }

  takeGallery() {
    this.updatedatetime();
    this.initlatencycheck();
    this.takePhoto(CameraSource.Photos);
    
  }
  
  
}
