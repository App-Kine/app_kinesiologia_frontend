import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonIcon, IonButton, IonMenuToggle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { menuOutline } from 'ionicons/icons';

@Component({
  selector: 'app-header',
  templateUrl: './header.page.html',
  styleUrls: ['./header.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonIcon, IonButton, IonMenuToggle, CommonModule, FormsModule]
})
export class HeaderPage implements OnInit {
  @Input() hideMenu: boolean;
  @Input() showBackButton: boolean;

  constructor() {
    this.hideMenu = false;
    this.showBackButton = false;
    addIcons({ menuOutline });
  }

  ngOnInit() {
  }

}
