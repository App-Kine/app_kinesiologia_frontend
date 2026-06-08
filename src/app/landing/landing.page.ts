import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  schoolOutline, easelOutline, arrowForward, pulseOutline,
} from 'ionicons/icons';

/**
 * Landing (pantalla de entrada) de Auris.
 *
 * Es el punto de inicio común de la app unificada. Presenta dos caminos:
 *   - "Soy estudiante" → entra directo al flujo del alumno (público, sin login).
 *   - "Soy profesor"   → va al login del panel docente/admin.
 *
 * Mantiene una portada neutra (identidad Auris) sin alterar el look de cada
 * sección, que conserva su propio estilo una vez dentro.
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  imports: [IonContent, IonIcon],
})
export class LandingPage {
  constructor(private router: Router) {
    addIcons({ schoolOutline, easelOutline, arrowForward, pulseOutline });
  }

  entrarEstudiante(): void {
    this.router.navigateByUrl('/estudiante/home');
  }

  entrarProfesor(): void {
    this.router.navigateByUrl('/login');
  }
}
