import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service'; 
import { NativeStorage } from '@ionic-native/native-storage/ngx';

@Injectable({
  providedIn: 'root'
})
export class EnlacesService extends BaseService {
  url: any;

  constructor(
    protected override httpClient: HttpClient,
    protected override storage: NativeStorage,
    protected override platform: Platform,
    protected override analyticsService: AnalyticsService
  ) {
    super(httpClient, platform, storage, analyticsService);
    this.url = this.BASE_URL;
  }

getExampleData(args: any): Promise<any> {
    return this.post(this.url + 'getData', args);
  }


}


  