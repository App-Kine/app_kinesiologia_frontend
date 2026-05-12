import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonSelect, IonSelectOption, IonList, IonListHeader , IonLabel, IonText} from '@ionic/angular/standalone';
import { HeaderPage } from '../../components/header/header.page';
import { EnlacesService } from '../../services/servicio-ejemplo.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonSelect, IonSelectOption, HeaderPage, IonList, IonListHeader, IonLabel, IonText],
})
export class HomePage implements OnInit {
  options: any[] = [];

  constructor(private enlacesService: EnlacesService) {}

  async ngOnInit() {
    console.log('Iniciando prueba de EnlacesService hacia localhost...');
    try {
      const response = await this.enlacesService.getExampleData({});
      console.log('Respuesta exitosa de EnlacesService:', response);
      this.options = Array.isArray(response) ? response : (response?.data || response?.items || response || []);
    } catch (error) {
      console.error('Error al probar EnlacesService:', error);
    }
  }
}
