# Howl 🐺

La red social de la comunidad UPVT: feed general, grupos por carrera, eventos, marketplace y chat en una sola app.

Hecha con **React Native + Expo**: un solo código para iPhone y Android.

## Paso 1: instalar todo en Windows (una sola vez)

1. **Node.js**: descarga la versión **LTS** de https://nodejs.org e instálala con "Siguiente, Siguiente". Para comprobar, abre la terminal (tecla Windows, escribe `cmd`) y escribe `node -v`. Debe salir un número como `v22...`.
2. **Git**: descárgalo de https://git-scm.com/download/win e instálalo con las opciones por defecto.
3. **Visual Studio Code**: descárgalo de https://code.visualstudio.com e instálalo. Marca la casilla "Agregar a PATH" si aparece.
4. **Expo Go en tu iPhone**: búscala en la App Store e instálala.

## Paso 2: descargar y abrir Howl

En la terminal:

```bash
git clone https://github.com/alfonsogonzalez-code/howl.git
cd howl
npm install
npx expo start
```

`npm install` tarda unos minutos la primera vez. Para abrir el código en VS Code escribe `code .` dentro de la carpeta.

## Paso 3: verla en tu iPhone

1. Tu PC y tu iPhone deben estar en **la misma red WiFi**.
2. Cuando corras `npx expo start` aparece un **código QR** en la terminal.
3. Abre la **cámara** del iPhone, apunta al QR y toca el aviso para abrirlo en Expo Go.
4. Cada vez que guardes un archivo en VS Code, la app se actualiza sola en tu teléfono.

**Si no carga:** la red de la escuela a veces bloquea la conexión entre dispositivos. Detén el servidor con `Ctrl + C` y usa `npx expo start --tunnel`. También revisa que el Firewall de Windows permita a Node.js en redes privadas.

## Configurar Supabase (una sola vez)

1. En supabase.com abre tu proyecto, entra a **SQL Editor**, dale **New query**, pega todo el archivo `supabase/schema.sql` y dale **Run**. Después haz lo mismo con `supabase/paso4-mensajes-notificaciones.sql` (chat grupal y notificaciones) y con `supabase/paso5-version-final.sql` (foto de perfil, notas, guardados y avisos al celular).
2. Entra a **Authentication → Sign In / Providers → Email** y desactiva **Confirm email**. Dale **Save**.
3. La URL y la llave del proyecto van en `src/config.ts`.
4. Para que los Android reciban avisos con la app cerrada hace falta Firebase (`google-services.json` en la raíz del proyecto y la llave de FCM subida a Expo). Los pasos están en [PUBLICAR.md](PUBLICAR.md).

Se entra con correo y contraseña. Más adelante se puede agregar verificación por correo conectando un servicio de correo (SMTP).

## Cómo está organizado el código

```
App.tsx                       Punto de entrada: abre siempre en la pestaña Inicio
app.config.js                 Usa google-services.json (Firebase) si existe
src/
  navigation.tsx              Barra de abajo (Inicio, Multimedia, +, Mercado, Perfil)
  navigationTypes.ts          Nombres de pantallas y qué datos reciben
  context/PostsContext.tsx    Publicaciones y acciones: corazón, guardar, votar, comentar, publicar
  screens/FeedScreen.tsx      Feed principal: notas, filtros, notificaciones y mensajes arriba
  screens/MediaScreen.tsx     Multimedia: fotos y videos a pantalla completa (como Reels)
  screens/ProfileScreen.tsx   Perfiles estilo Instagram (el tuyo y el de los demás)
  screens/EditProfileScreen.tsx  Cambiar foto, nombre, descripción y carrera
  screens/NoteScreen.tsx      Escribir tu nota (dura 24 horas)
  components/NotesRow.tsx     Fila de notas arriba del Feed
  components/CropBox.tsx      Recortar fotos en cualquier forma
  components/GridTile.tsx     Cuadritos de la cuadrícula del perfil
  context/ActionSheetContext.tsx  Menú de opciones que sale desde abajo
  lib/media.ts                Elegir, recortar y subir fotos y videos
  lib/push.ts                 Avisos al celular
  screens/MarketScreen.tsx    Mercado en cuadrícula
  screens/ChatsScreen.tsx     Lista de chats: solo el grupo de tu carrera
  screens/ChatRoomScreen.tsx  Conversación del grupo, estilo WhatsApp
  screens/NotificationsScreen.tsx  Likes, respuestas, votos y asistentes
  context/ChatContext.tsx     Unirse, mensajes en tiempo real y no leídos
  context/NotificationsContext.tsx  Notificaciones en tiempo real
  context/BannerContext.tsx   Avisos que bajan desde arriba
  hooks/useKeyboardInset.ts   Deja la barra de escribir justo encima del teclado
  screens/ThreadScreen.tsx    Hilo de respuestas de una publicación
  screens/ComposerScreen.tsx  Formulario para publicar (cambia según el tipo)
  components/PostCard.tsx     Diseño de cada tipo de publicación
  components/CreateSheet.tsx  Menú que sale al tocar el +
  context/AuthContext.tsx     Inicio de sesión y perfil
  screens/LoginScreen.tsx     Entrar o crear cuenta con correo y contraseña
  screens/ProfileSetupScreen.tsx  Nombre y carrera la primera vez
  lib/supabase.ts             Conexión con la base de datos
  config.ts                   Datos de Supabase y lista de carreras
supabase/schema.sql           Tablas y reglas de seguridad de la base de datos
supabase/paso4-mensajes-notificaciones.sql  Chat por carrera y notificaciones
supabase/paso5-version-final.sql  Perfil con foto y nota, guardados y avisos al celular
  types.ts, theme.ts          Tipos de datos y colores
```

Para compartir la app sin tu PC (APK para Android y actualizaciones para iPhone) sigue [PUBLICAR.md](PUBLICAR.md).

## Lo que sigue

- [x] Paso 1: proyecto inicial con el Feed de ejemplo
- [x] Paso 2: Feed estilo Instagram, botón +, corazón y respuestas en hilo
- [x] Paso 3: inicio de sesión con correo y contraseña, y publicaciones guardadas (Supabase)
- [x] Paso 4: chat grupal por carrera en tiempo real y notificaciones dentro de la app
- [x] Paso 5 (versión final): estilo Instagram, perfiles con foto y nota, Multimedia con videos, recortes libres, guardados y avisos al celular
- [ ] Lo que sigue: reportes y moderación
