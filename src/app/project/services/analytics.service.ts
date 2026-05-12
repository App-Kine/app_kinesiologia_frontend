import { Injectable, ErrorHandler } from '@angular/core';
import { Platform } from '@ionic/angular';
// import { FirebaseAnalytics } from '@ionic-native/firebase-analytics/ngx';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService extends ErrorHandler {
  constructor(
    private platform: Platform,
    // private firebaseAnalytics: FirebaseAnalytics
  ) {
    super();
    this.initFirebaseAnalytics();
  }

  async initializeDataCollection() {
    // this.initFirebaseAnalytics();
  }

  private isMobilePlatform(): boolean {
    return this.platform.is('hybrid');
  }
  private async initFirebaseAnalytics() {
  /*  if (this.isMobilePlatform()) {
      await this.firebaseAnalytics.resetAnalyticsData();
    }*/
  }
/*
  // Track an event with custom events and params
  async trackView(view_url: string) {
    if (this.isMobilePlatform()) {
      await this.firebaseAnalytics.setCurrentScreen(view_url);
      console.log(view_url);
    }
  }

  // Track an event with custom events and params
  async trackEvent(event_name: string, params?: object) {
    if (this.isMobilePlatform()) {
      var eventParams = {};
      if (params) {
        for (const key in params) {
          eventParams[key] = params[key];
        }
      }
      await this.firebaseAnalytics.logEvent(event_name, eventParams);
    }
  }*/

  async ErrorHandler(error: Error) {
    super.handleError(error);
    try {
      console.log(error);
    } catch (e) {
      console.error(e);
    }
  }
}
