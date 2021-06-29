import { Component, ɵSafeResourceUrl } from '@angular/core';
import { Capacitor, Plugins } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, FilesystemDirectory, Encoding } from '@capacitor/filesystem';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { Geolocation } from '@ionic-native/geolocation';
import { Platform } from '@ionic/angular';


declare var window: any;

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

  seamlessMode: boolean;
  photo: SafeResourceUrl;
  
  public path = "";
  
  constructor(private sanitizer: DomSanitizer, private http: HttpClient, private platform: Platform) {}

  //for browser
  locate(){
    Geolocation.getCurrentPosition().then((resp)=>{
      this.geolat = "latitude: " + resp.coords.latitude;
      this.geolong = "longitude: " + resp.coords.longitude;
    }).catch((error)=>{
      
      this.geolat = "latitude: error";
      this.geolong = "longitude: error";
    });
    

    this.datetime = new Date().toDateString();
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
  
  /*async takePicture() {
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera
    }).then()

    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(image && (image.dataUrl))
  }
*/
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

  takePhoto(myCameraSource: CameraSource){
    if(this.platform.is('android')){
      const options = {
        quality: 60,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: myCameraSource,
	    	format: "jpeg"
      };
      const fileName = new Date().getTime() + ".jpeg";
      Camera.getPhoto(options).then((image)=>{
		  try{
			const tempstorage = Filesystem.readFile({path: image.path});
			
			this.path = image.path;
			this.geoerror = this.path;
			  
			this.base64FromPath(image.webPath).then((base64Data)=>{
			  this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(base64Data);
			});
			
			this.path = this.path.replace('file://', '');
		  }catch{}
		  finally{
			/*
			  try{ window.cordova.plugin.ftp.disconnect(); } catch{}
			  try{
				window.cordova.plugin.ftp.connect('115.145.170.225:1111', 'username', 'password');
			  }
			  catch{}
			  finally{
				window.cordova.plugin.ftp.upload(this.path, "destination/" + fileName);
			  }
			  */
			  
				var sftp = new window.JJsftp('115.145.170.225', 'nemoux', 'nemoux');
				sftp.upload('/home/nemoux/ftpclient/destination/', this.path, (good)=>{}, (bad)=>{});
		  }

		});
		  

      
    }
    else{
      const options = {
        quality: 60,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: myCameraSource,
	    	format: "jpeg"
      };
      const fileName = new Date().getTime() + ".jpeg";
      Camera.getPhoto(options).then((image)=>{
        
        this.path = image.webPath;
        this.geoerror = this.path;
          
        this.base64FromPath(image.webPath).then((base64Data)=>{
          this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(base64Data);

          
          this.path = this.path.replace('file://', '');

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


    this.locate();


    if(this.seamlessMode){
      
      
      //let photoblob = this.dataURItoBlob(image.dataUrl);

      //let formData = new FormData();
      //formData.append("file", await photoblob, new Date().getTime() + ".png");
      
      //this.http.post("http://115.145.170.217:3000/upload", formData).subscribe((response)=>{ console.log(response)});
    }
  }
/*
  async takeGallery() {
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos
    });

    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(image && (image.dataUrl))
  }
*/

  takeGallery() {
    this.takePhoto(CameraSource.Photos);   
    

    this.locate();


    if(this.seamlessMode){
      //let photoblob = this.dataURItoBlob(image.dataUrl);

      //let formData = new FormData();
      //formData.append("file", await photoblob, new Date().getTime() + ".png");
      
      //this.http.post("http://115.145.170.217:3000/upload", formData).subscribe((response)=>{ console.log(response)});
    }
  }
  
  
}