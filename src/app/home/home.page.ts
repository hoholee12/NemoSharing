import { Component, ɵSafeResourceUrl } from '@angular/core';
import { Plugins } from '@capacitor/core'
import { CameraResultType, CameraSource } from '@capacitor/camera';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  seamlessMode: boolean;
  photo: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {}

  async isChecked() {
    console.log('State:' + this.seamlessMode);

    /* TODO: Add transmission code (seamlessMode == true) */
  }
  
  async takePicture() {
    const image = await Plugins.Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera
    });

    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(image && (image.dataUrl))
  }

  async takeGallery() {
    const image = await Plugins.Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos
    });
    
    console.log('metadata of photo: '+image);
    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(image && (image.dataUrl))
  }

}