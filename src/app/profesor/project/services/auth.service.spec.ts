import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { AuthService, LoginResponse, UsuarioSesion } from './auth.service';
import { AnalyticsService } from './analytics.service';
import { environment } from '../../../../environments/environment';

/**
 * Tests de AuthService (login / logout / isAuthenticated + storage).
 *
 * Determinista: sin red real. `post` (heredado de BaseService) se stubea.
 * El storage corre por la rama web (localStorage), forzando
 * isMobilePlatform() = false; localStorage se limpia entre tests.
 */
describe('AuthService', () => {
  let service: AuthService;
  let routerSpy: jasmine.SpyObj<Router>;

  const KEY_TOKEN = environment.DATA_KEY_TOKEN;

  const usuario: UsuarioSesion = {
    usuario_id: 1,
    nombre: 'Docente Demo',
    correo: 'demo@auris.test',
    roles: ['PROFESOR'],
  };

  const loginResp: LoginResponse = {
    token: 'tok-123',
    refreshToken: 'refresh-123',
    tokenType: 'Bearer',
    expiresIn: '3600',
    usuario,
  };

  beforeEach(() => {
    localStorage.clear();

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    routerSpy.navigateByUrl.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
        // Deps de BaseService — no se ejercitan directamente, basta con stubs.
        { provide: HttpClient, useValue: jasmine.createSpyObj('HttpClient', ['post']) },
        { provide: NativeStorage, useValue: jasmine.createSpyObj('NativeStorage', ['setItem', 'getItem', 'remove', 'clear']) },
        { provide: Platform, useValue: jasmine.createSpyObj('Platform', ['is']) },
        { provide: AnalyticsService, useValue: jasmine.createSpyObj('AnalyticsService', ['ErrorHandler']) },
      ],
    });

    service = TestBed.inject(AuthService);
    // Forzar rama web → usa localStorage (determinista, sin nativo).
    spyOn(service, 'isMobilePlatform').and.returnValue(false);
  });

  afterEach(() => localStorage.clear());

  it('login guarda token, refresh y usuario, y devuelve el usuario', async () => {
    // Stub del POST heredado de BaseService (sin red).
    spyOn<any>(service, 'post').and.resolveTo(loginResp);

    const result = await service.login('demo@auris.test', 'secreta');

    expect(result).toEqual(usuario);
    expect(JSON.parse(localStorage.getItem(KEY_TOKEN)!)).toBe('tok-123');
    expect(JSON.parse(localStorage.getItem('refreshToken')!)).toBe('refresh-123');
    expect(JSON.parse(localStorage.getItem('usuario')!)).toEqual(usuario);
  });

  it('isAuthenticated es true cuando hay token guardado', async () => {
    localStorage.setItem(KEY_TOKEN, JSON.stringify('tok-123'));
    await expectAsync(service.isAuthenticated()).toBeResolvedTo(true);
  });

  it('isAuthenticated es false cuando no hay token', async () => {
    await expectAsync(service.isAuthenticated()).toBeResolvedTo(false);
  });

  it('logout intenta limpiar token, refresh, usuario y panel, y redirige a /login', async () => {
    // Espiamos removeStoreData para verificar las 4 claves borradas, de forma
    // independiente de la plataforma (web vs nativo).
    const removeSpy = spyOn(service, 'removeStoreData').and.resolveTo(undefined);

    await service.logout();

    expect(removeSpy).toHaveBeenCalledWith(KEY_TOKEN);
    expect(removeSpy).toHaveBeenCalledWith('refreshToken');
    expect(removeSpy).toHaveBeenCalledWith('usuario');
    expect(removeSpy).toHaveBeenCalledWith('panel_actual');
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });

  it('removeStoreData en web borra realmente la key de localStorage (regresión)', async () => {
    localStorage.setItem(KEY_TOKEN, JSON.stringify('tok-123'));
    await service.removeStoreData(KEY_TOKEN);
    expect(localStorage.getItem(KEY_TOKEN)).toBeNull();
  });

  it('getRoles devuelve los roles del usuario guardado, o [] si no hay', async () => {
    await expectAsync(service.getRoles()).toBeResolvedTo([]);

    localStorage.setItem('usuario', JSON.stringify(usuario));
    await expectAsync(service.getRoles()).toBeResolvedTo(['PROFESOR']);
  });

  describe('rutaDestinoSegunRoles', () => {
    it('superadmin + profesor → /seleccion-panel', () => {
      expect(service.rutaDestinoSegunRoles(['SUPERADMIN', 'PROFESOR'])).toBe('/seleccion-panel');
    });
    it('solo superadmin → /panel-admin', () => {
      expect(service.rutaDestinoSegunRoles(['SUPERADMIN'])).toBe('/panel-admin');
    });
    it('solo profesor → /panel-docente', () => {
      expect(service.rutaDestinoSegunRoles(['PROFESOR'])).toBe('/panel-docente');
    });
    it('sin roles válidos → /login', () => {
      expect(service.rutaDestinoSegunRoles([])).toBe('/login');
    });
  });
});
