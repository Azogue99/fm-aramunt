# Festa Major d'Aramunt - Web App

Aquesta és l'aplicació web per a la Festa Major d'Aramunt, desenvolupada amb React, TypeScript, Tailwind CSS i Firebase.

## Seguretat i Configuració d'Entorn (Secrets)

L'aplicació utilitza Firebase per a l'autenticació i la base de dades (Firestore). **MAI** has de pujar credencials reals al repositori públic.

### Com obtenir els secrets:
1. Accedeix a la consola de [Firebase](https://console.firebase.google.com/).
2. Crea un projecte o selecciona el projecte corresponent.
3. Ves a "Configuració del projecte" (roda dentada) -> "General".
4. A la secció de les teves aplicacions (o afegeix una app Web si no n'hi ha cap), trobaràs la configuració del SDK de Firebase.

### Configuració Local
Crea un fitxer anomenat `.env.local` a l'arrel d'aquest projecte (Aquest fitxer està ignorat per `.gitignore`).
Afegeix-hi les variables següents (substitueix els valors pels del teu projecte Firebase):

```env
VITE_FIREBASE_API_KEY=el_teu_api_key
VITE_FIREBASE_AUTH_DOMAIN=el_teu_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=el_teu_project_id
VITE_FIREBASE_STORAGE_BUCKET=el_teu_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=el_teu_sender_id
VITE_FIREBASE_APP_ID=el_teu_app_id
```

## Comandes Útils
- `npm run dev`: Inicia el servidor de desenvolupament.
- `npm run build`: Construeix l'aplicació per a producció.
- `firebase deploy`: Desplega l'aplicació a Firebase Hosting (requereix tenir instal·lat Firebase CLI i haver fet login amb `firebase login`).
