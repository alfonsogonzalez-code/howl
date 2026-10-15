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

## Cómo está organizado el código

```
App.tsx                     Punto de entrada: abre siempre el Feed
src/
  screens/FeedScreen.tsx    Pantalla principal (Feed) con el ícono de chats
  screens/ChatsScreen.tsx   Lista de grupos por carrera
  components/PostCard.tsx   Diseño de cada tipo de publicación
  data/posts.ts             Publicaciones de ejemplo (luego vendrán de la base de datos)
  types.ts                  Qué datos tiene cada tipo de publicación
  theme.ts                  Colores de la app
```

Tipos de publicación que ya se ven en el Feed: mensaje (estilo tweet), encuesta con incisos, producto (foto, precio, nombre en negrita y descripción), evento y foto.

## Lo que sigue

- [x] Paso 1: proyecto inicial con el Feed de ejemplo
- [ ] Paso 2: pulir el diseño del Feed
- [ ] Paso 3: inicio de sesión con correo institucional (Supabase)
- [ ] Paso 4: publicar desde la app
- [ ] Paso 5: chats por carrera en tiempo real
- [ ] Paso 6: notificaciones, reportes y moderación
