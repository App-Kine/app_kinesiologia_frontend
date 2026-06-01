#!/bin/bash
# =====================================================================
#  Setup iOS para Auris (Capacitor + Xcode)
#
#  Corre este script una sola vez para dejar el proyecto iOS armado.
#  Después, para actualizar la app después de cambios en el código web:
#      npm run build && npx cap sync ios
#  ...y volvés a apretar ▶ Play en Xcode.
#
#  Uso:
#      cd app_kinesiologia_frontend
#      bash setup-ios.sh
# =====================================================================

set -e
cd "$(dirname "$0")"

echo ""
echo "🩺 Auris · Setup iOS"
echo "===================="
echo ""

# --------------------------------------------------------------------
# 1. Pre-checks
# --------------------------------------------------------------------
echo "🔍 Verificando entorno..."

if ! command -v node &> /dev/null; then
  echo "❌ Node.js no está instalado. Bajalo de https://nodejs.org"
  exit 1
fi

if ! command -v xcodebuild &> /dev/null; then
  echo "❌ Xcode no está instalado. Bajalo del Mac App Store y volvé a correr este script."
  exit 1
fi

XCODE_PATH=$(xcode-select -p 2>/dev/null || echo "")
if [[ "$XCODE_PATH" != *"Xcode.app"* ]]; then
  echo "⚠  xcode-select apunta a Command Line Tools, no a Xcode.app."
  echo "    Corré primero:"
  echo "      sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  exit 1
fi

if ! command -v pod &> /dev/null; then
  echo "❌ CocoaPods no está instalado."
  echo "    Instalalo con:"
  echo "      sudo gem install cocoapods"
  echo "    o con Homebrew:"
  echo "      brew install cocoapods"
  exit 1
fi

# Aceptar licencia de Xcode si hace falta (silencioso si ya está aceptada)
sudo xcodebuild -license accept 2>/dev/null || true

echo "  ✓ Node:        $(node --version)"
echo "  ✓ Xcode:       $(xcodebuild -version | head -1)"
echo "  ✓ CocoaPods:   $(pod --version)"
echo ""

# --------------------------------------------------------------------
# 2. Instalar @capacitor/ios si falta
# --------------------------------------------------------------------
echo "▶ 1/5 Sincronizando paquetes Capacitor (versión 7, compatible con Node 20)..."
# Capacitor 8 exige Node 22; este proyecto está fijado a Node 20.19.0, así que
# usamos la rama Capacitor 7.x (totalmente vigente, soporta Node 20).
# Las versiones en package.json ya están en ^7. Este npm install sincroniza
# node_modules con package.json: si ya estaban en v8 (de una corrida previa),
# las baja a v7. Si ya están en v7, no hace nada.
#
# --legacy-peer-deps: el proyecto usa @ionic-native/native-storage (Cordova
# legacy) que en su peer dep pide rxjs 5/6, pero el resto del proyecto corre
# rxjs 7. En la práctica funciona, así que le decimos a npm que ignore ese
# conflicto al resolver.
CAP_CORE_VER=$(npm list @capacitor/core --depth=0 2>/dev/null | grep '@capacitor/core@' | head -1 || echo "")
if [[ "$CAP_CORE_VER" != *"@capacitor/core@7."* ]]; then
  echo "  Bajando @capacitor/* a 7.x..."
  npm install --legacy-peer-deps
else
  echo "  ✓ Capacitor 7 ya instalado."
fi
echo ""

# --------------------------------------------------------------------
# 3. Build Angular (genera www/)
# --------------------------------------------------------------------
echo "▶ 2/5 Build de Angular (genera www/)..."
npm run build
echo ""

# --------------------------------------------------------------------
# 4. Agregar plataforma iOS
# --------------------------------------------------------------------
echo "▶ 3/5 Agregando plataforma iOS..."
if [ ! -d "ios" ]; then
  npx cap add ios
else
  echo "  ✓ Carpeta ios/ ya existe."
fi
echo ""

# --------------------------------------------------------------------
# 5. Parchear Info.plist con ATS exception (permitir HTTP plano)
#    El backend dev corre en http://localhost:2000 y :3023.
#    Sin esto iOS bloquea las requests.
# --------------------------------------------------------------------
PLIST="ios/App/App/Info.plist"
echo "▶ 4/5 Parcheando Info.plist (App Transport Security)..."
if [ ! -f "$PLIST" ]; then
  echo "❌ $PLIST no existe. Algo falló con 'cap add ios'."
  exit 1
fi

if ! /usr/libexec/PlistBuddy -c "Print :NSAppTransportSecurity" "$PLIST" >/dev/null 2>&1; then
  /usr/libexec/PlistBuddy -c "Add :NSAppTransportSecurity dict" "$PLIST"
fi
if ! /usr/libexec/PlistBuddy -c "Print :NSAppTransportSecurity:NSAllowsArbitraryLoads" "$PLIST" >/dev/null 2>&1; then
  /usr/libexec/PlistBuddy -c "Add :NSAppTransportSecurity:NSAllowsArbitraryLoads bool true" "$PLIST"
else
  /usr/libexec/PlistBuddy -c "Set :NSAppTransportSecurity:NSAllowsArbitraryLoads true" "$PLIST"
fi
echo "  ✓ NSAllowsArbitraryLoads = true"
echo ""

# --------------------------------------------------------------------
# 6. Sync + abrir Xcode
# --------------------------------------------------------------------
echo "▶ 5/5 Sync iOS y abriendo Xcode..."
npx cap sync ios
npx cap open ios
echo ""

# --------------------------------------------------------------------
# Mensaje final con instrucciones
# --------------------------------------------------------------------
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")

echo "✅ Listo. Xcode debería estar abriéndose."
echo ""
echo "📱 En Xcode:"
echo "   1. Esperá que termine de indexar (puede tardar 1-2 min la primera vez)"
echo "   2. Elegí 'App' como esquema y un simulator (ej. iPhone 15 Pro) en la"
echo "      barra superior, al lado del botón ▶ Play"
echo "   3. Apretá ▶ Play (o Cmd+R)"
echo ""
echo "💡 Antes de probar la app, asegurate de tener corriendo:"
echo "   - SQL Server local (puerto 1433)"
echo "   - Lógica:        cd app_kinesiologia_logica       && npm start"
echo "   - Controlador:   cd app_kinesiologia_controlador  && npm start"
echo ""

if [ -n "$IP" ]; then
  echo "🌐 Para correr en iPhone físico (no simulator):"
  echo "   1. Editá src/environments/environment.ts y reemplazá:"
  echo "        'http://localhost:2000'  →  'http://${IP}:2000'"
  echo "        'http://localhost:3023'  →  'http://${IP}:3023'"
  echo "   2. Volvé a correr:  npm run build && npx cap sync ios"
  echo "   3. En Xcode elegí tu iPhone (conectado por cable o WiFi) y ▶ Play"
fi
echo ""
echo "🔄 Loop de desarrollo (después del setup inicial):"
echo "   - Cambiás código → npm run build && npx cap sync ios → ▶ Play en Xcode"
echo ""
