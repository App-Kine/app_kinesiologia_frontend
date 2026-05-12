import { Component, OnInit } from '@angular/core';
import { HeaderPage } from '../../components/header/header.page';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-example-page-1',
  templateUrl: './example-page-1.page.html',
  styleUrls: ['./example-page-1.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderPage]
})
export class ExamplePage1Page implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
