import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle, IonAvatar, IonNote } from '@ionic/angular/standalone';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { addIcons } from 'ionicons';
import { playCircle, information, menuOutline, homeOutline, informationCircleOutline, bookOutline, personOutline, logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle, IonAvatar, IonNote, RouterLink, RouterLinkActive],
})
export class AppComponent {
  constructor() {
    addIcons({ playCircle, information, menuOutline, homeOutline, informationCircleOutline, bookOutline, personOutline, logOutOutline });
  }
}
