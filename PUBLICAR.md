# Cómo compartir Howl sin tener la PC prendida

Primero lo importante: **la base de datos (Supabase) ya está en internet** y funciona aunque tu PC esté apagada. Lo único que hoy depende de tu PC es el "servidor de Expo" (`npx expo start`), que le manda el código de la app a tu iPhone. Aquí lo cambiamos por dos cosas:

- **APK para Android:** la app completa en un archivo que se instala como cualquier app. No necesita tu PC ni Expo Go.
- **EAS Update para tu iPhone:** el código de la app se sube a los servidores de Expo y Expo Go lo abre desde ahí, sin tu PC.

Todo esto es gratis. Los dos usan la misma base de datos: lo que publiques en Android se ve en el iPhone y al revés.

---

## Parte 0: Preparar tu PC (solo la primera vez)

1. Abre la terminal (tecla Windows → escribe `cmd` → Enter).
2. Instala la herramienta de Expo para publicar (se llama EAS):
   ```
   npm install -g eas-cli
   ```
   Tarda un par de minutos. Al final no debe salir ningún `ERR!` en rojo.
3. Inicia sesión con **la misma cuenta de Expo** que usas en Expo Go:
   ```
   eas login
   ```
   Te pide tu usuario (o correo) y contraseña de Expo.
4. Entra a la carpeta del proyecto:
   ```
   cd C:\Users\ponch\Downloads\howl
   ```
5. Conecta el proyecto con tu cuenta de Expo:
   ```
   eas init
   ```
   Si pregunta *"Would you like to create a project for @tu-usuario/howl?"*, escribe `Y` y Enter.
6. Activa las actualizaciones por internet:
   ```
   eas update:configure
   ```
   Si pregunta algo, contesta `Y`.

Al terminar, `app.json` y `eas.json` habrán cambiado solos. Es normal.

---

## Parte 1: Crear el APK para Android

1. En la terminal, dentro de la carpeta del proyecto:
   ```
   eas build -p android --profile preview
   ```
2. Te va a preguntar:
   - *"Generate a new Android Keystore?"* → escribe `Y` y Enter. (Es la "firma" de tu app; Expo la guarda por ti.)
3. El APK se arma **en los servidores de Expo**, no en tu PC. En la terminal aparece un enlace a `expo.dev`. La espera suele ser de 10 a 30 minutos en la cuenta gratis. Puedes cerrar la terminal; el progreso se ve en ese enlace.
4. Cuando termine, en esa página de `expo.dev` aparece el botón **Install** y un **código QR**.

**Para instalarlo en un Android:**
1. Desde el Android, abre el enlace o escanea el QR con la cámara.
2. Toca **Download** y abre el archivo `.apk`.
3. Android va a avisar que es de "origen desconocido": toca **Configuración** → activa **Permitir de esta fuente** → regresa e **Instalar**.
4. Listo, aparece **Howl** con las demás apps.

Puedes mandar ese mismo enlace por WhatsApp a tus compañeros con Android.

---

## Parte 2: Que tu iPhone abra Howl sin la PC

1. En la terminal, dentro de la carpeta del proyecto:
   ```
   eas update --branch preview --message "Version para el profe"
   ```
   Tarda uno o dos minutos. Al final muestra un enlace a `expo.dev`.
2. Abre ese enlace en la PC. En la página de la actualización aparece un botón o un **QR para abrir en Expo Go** (puede decir *Preview*).
3. En tu iPhone, abre **Expo Go** (con sesión iniciada en tu cuenta) y escanea ese QR con la cámara.
4. Ya puedes **apagar la PC**: Howl queda en la lista de **Recientes** de Expo Go y se abre desde ahí.

**Si otra persona quiere probarla en su iPhone:** Apple solo deja que Expo Go abra proyectos de la cuenta con la que inició sesión. Esa persona tiene que instalar Expo Go e iniciar sesión con tu cuenta de Expo, o puedes invitarla a tu equipo en expo.dev (Account settings → Members).

---

## Parte 3: Cuando cambies algo en la app

Cada vez que quieras que los demás vean tus cambios:

```
eas update --branch preview --message "Qué cambiaste"
```

- **En los Android con el APK:** la próxima vez que abran Howl se descarga el cambio; la siguiente vez que la abran ya aparece.
- **En tu iPhone:** abre Howl desde Expo Go y se actualiza solo.

Solo necesitas hacer un **APK nuevo** (Parte 1) si agregas un paquete nuevo con `npm install` o cambias `app.json`. Para cambios de pantallas, colores o textos basta con `eas update`.

Y no olvides subir tus cambios a GitHub:
```
git add .
git commit -m "Qué cambiaste"
git push
```

---

## Parte 4: Avisos al celular en Android (Firebase, una sola vez)

En iPhone (Expo Go) los avisos funcionan sin hacer nada. Para que el **APK de Android** los reciba con la app cerrada, Google pide conectar la app con **Firebase** (es gratis). Esto se hace una sola vez y **antes** de crear el APK.

**A. Crear el proyecto en Firebase**
1. Entra a https://console.firebase.google.com con tu cuenta de Google.
2. Toca **Crear un proyecto** (o *Agregar proyecto*), ponle de nombre `howl` y dale **Continuar**. Google Analytics lo puedes desactivar. Al final dale **Crear proyecto**.
3. Ya adentro, toca el ícono de **Android** (dice *Agregar app*).
4. En **Nombre del paquete de Android** escribe exactamente: `com.upvt.howl` y toca **Registrar app**.
5. Toca **Descargar google-services.json** y guarda ese archivo en la carpeta del proyecto, junto a `app.json`:
   `C:\Users\ponch\Downloads\howl\google-services.json`
6. Lo demás del asistente (agregar el SDK de Firebase) **no se hace**: dale **Siguiente** hasta **Ir a la consola**.

`google-services.json` no es secreto: sí se sube a GitHub (si GitHub te manda un correo de "secret detected" por ese archivo, es normal).

**B. Darle a Expo la llave para mandar avisos**
1. En Firebase toca el engrane ⚙️ → **Configuración del proyecto** → pestaña **Cuentas de servicio**.
2. Toca **Generar nueva clave privada** → **Generar clave**. Se descarga un archivo `.json` que dice `firebase-adminsdk` en el nombre.
   ⚠️ **Este archivo SÍ es secreto.** Guárdalo en Documentos, **no** en la carpeta del proyecto y **nunca** lo subas a GitHub.
3. Súbelo a Expo desde la terminal, dentro de la carpeta del proyecto:
   ```
   npx eas-cli credentials -p android
   ```
   - Si pregunta el perfil, elige **preview**.
   - Elige **Google Service Account**.
   - Elige **Manage your Google Service Account Key for Push Notifications (FCM V1)**.
   - Elige **Set up a Google Service Account Key for Push Notifications (FCM V1)** y luego **Upload a new service account key**.
   - Cuando pida la ruta, escribe dónde quedó el archivo, por ejemplo `C:\Users\ponch\Documents\howl-firebase-adminsdk-xxxxx.json`.
4. Listo. Ahora sí crea el APK (Parte 1). Los APK viejos no reciben avisos; hay que instalar el nuevo.
