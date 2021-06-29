import { Component, ɵSafeResourceUrl } from '@angular/core';
import { Capacitor, Plugins } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { Geolocation } from '@ionic-native/geolocation';



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

  constructor(private sanitizer: DomSanitizer, private http: HttpClient) {}

  //for browser
  async locate(){
    await Geolocation.getCurrentPosition().then((resp)=>{
      this.geolat = "latitude: " + resp.coords.latitude;
      this.geolong = "longitude: " + resp.coords.longitude;
    }).catch((error)=>{
      this.geoerror = error;
      this.geolat = "latitude: error";
      this.geolong = "longitude: error";
    });
    
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
  
  async isChecked() {
    console.log('State:' + this.seamlessMode);


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
  async takePicture() {
    const options = {
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera
    };

    const image = await Camera.getPhoto(options);
    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(image.dataUrl);
    console.log(image);
    console.log(this.photo);

    this.datetime = new Date().toDateString();
    await this.locate();
    

    if(this.seamlessMode){
      let photoblob = this.dataURItoBlob(image.dataUrl);

      let formData = new FormData();
      formData.append("file", await photoblob, new Date().getTime() + ".png");
      
      this.http.post("http://115.145.170.217:3000/upload", formData).subscribe((response)=>{ console.log(response)});
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

  async takeGallery() {
    const options = {
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos
    };

    const image = await Camera.getPhoto(options);
    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(image.dataUrl);
    console.log(image);
    console.log(this.photo);

    this.datetime = new Date().toDateString();
    await this.locate();
    

    if(this.seamlessMode){
      let photoblob = this.dataURItoBlob(image.dataUrl);

      let formData = new FormData();
      formData.append("file", await photoblob, new Date().getTime() + ".png");
      
      this.http.post("http://115.145.170.217:3000/upload", formData).subscribe((response)=>{ console.log(response)});
    }
  }
  
  
}