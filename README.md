# Festa Major d'Aramunt 2026

Web de la Festa Major d'Aramunt feta amb React, TypeScript, Tailwind CSS i Firebase.

## Què inclou

- Web pública multipàgina: inici, programa, tornejos i comissió.
- Inscripció i gestió d'equips amb enllaços d'invitació.
- Classificacions, fase de grups i quadre d'eliminatòries.
- Panells per a superadministració, responsables de cada torneig i barra/TPV.
- Rols combinables: `superadmin`, `admin_futbol`, `admin_basquet` i `barista`.

## Posada en marxa

Necessites Node.js 20 o posterior i un projecte Firebase amb Authentication (Google) i Firestore activats.

```bash
npm ci
```

Crea `.env.local` a l'arrel (és ignorat per Git) amb la configuració de la teva aplicació web de Firebase:

```env
VITE_FIREBASE_API_KEY=el_teu_api_key
VITE_FIREBASE_AUTH_DOMAIN=el_teu_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=el_teu_project_id
VITE_FIREBASE_STORAGE_BUCKET=el_teu_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=el_teu_sender_id
VITE_FIREBASE_APP_ID=el_teu_app_id
```

Arrenca el servidor local amb `npm run dev`. Per comprovar la compilació de producció, executa `npm run build`; el lint s'executa independentment amb `npm run lint`.

## Dades inicials de Firestore

Perquè aparegui un torneig, crea un document a `tournaments` amb un id qualsevol i una estructura com aquesta. El `slug` és el que defineix l'URL pública (`/tornejos/futbol`) i la seva ruta de panell (`/panell/tornejos/futbol`).

```json
{
  "slug": "futbol",
  "name": "Futbol 5v5",
  "sport": "futbol",
  "year": 2026,
  "managerRole": "admin_futbol",
  "registrationOpen": true,
  "minPlayers": 5,
  "maxPlayers": 8,
  "phase": "inscripcions",
  "groups": [],
  "knockoutSize": 4,
  "qualifiersPerGroup": 2,
  "order": 1
}
```

El primer superadministrador s'ha d'assignar manualment al document `users/{uid}` amb `roles: ["superadmin"]`. Després, des del panell d'usuaris, pots gestionar rols i reservar-los per a persones que encara no han iniciat sessió.

## Regles i desplegament

`firestore.rules` protegeix les escriptures segons el rol i impedeix que una persona s'autoassigni permisos. `firestore.indexes.json` conté l'índex compost necessari per consultar els partits d'eliminatòria per torneig.

Amb la [Firebase CLI](https://firebase.google.com/docs/cli) autenticada i el projecte correcte configurat a `.firebaserc`:

```bash
npm run build
firebase deploy
```

Aquesta ordre publica Hosting, les regles i els índexs. No pugis mai `.env.local` ni cap credencial de servei al repositori.
