# FocusFlow

Adaptiver ADHS-Tagesplaner — React 18 + Vite + TypeScript. Wissenschaftlich
fundierte Werkzeuge gegen die typischen ADHS-Hürden, gepaart mit einer
modernen, reizarmen Oberfläche auf monday.com-Niveau.

## Features

**Planung**
- Adaptiver Tagesplan mit automatischen Pausen (kurz/lang nach 3 Blöcken)
- Wochenplan mit Zeitbudgets pro Projekt & Deadline-Druck
- Kanban-**Board** (Backlog → Heute → In Arbeit → Erledigt) mit Drag & Drop
- Automatische Umplanung verpasster Aufgaben (kein Shame-Loop)

**ADHS-spezifisch (wissenschaftlich)**
- 🧠 **Brain-Dump**: Ein-Klick-Inbox zum sofortigen Auslagern von Gedanken
  (entlastet das Arbeitsgedächtnis)
- 🪓 **Auto-Zerlegung**: große Projekte werden in winzige Schritte zerlegt —
  inkl. „nur anfangen“-Starter gegen die Aktivierungsblockade
- ⏳ **Zeitblindheit-Hilfen**: schrumpfender Zeit-Ring, „Jetzt / Als Nächstes“,
  geschätzte vs. tatsächlich fokussierte Zeit
- 🏆 **Gamification**: XP, Level, Erfolge, Streaks & Konfetti (Dopamin-System)
- 🧘 **Ruhe-Modus**: reduziert Animationen & visuelle Reize

**Komfort**
- ⌘K **Command-Palette** zum Springen & für Aktionen
- Dark/Light Mode, vollständig tastaturbedienbar, `prefers-reduced-motion`
- Mobile-first mit Bottom-Navigation

**Datenbank & Login: Supabase + Google**
- 🔐 **Google-Login** über Supabase Auth
- ☁️ Projekte/Aufgaben werden dauerhaft & geräteübergreifend in **Supabase**
  (Postgres, ein JSONB-Datensatz pro User) gespeichert — abgesichert per
  Row-Level-Security
- 📅 **Google-Kalender-Sync in beide Richtungen**: Termine importieren *und*
  die heutigen Fokus-Blöcke als Kalendereinträge exportieren

Lokal bleibt `localStorage` die schnelle Quelle; bei Anmeldung wird automatisch
mit der Cloud synchronisiert (Pull beim Login, debounced Push bei Änderungen).

## Entwicklung

```bash
npm install
npm run dev
npm run build
```

Die Supabase-Verbindung steht in `src/config.ts` (Project-URL + publishable key —
beide sind für den Browser gedacht; Schutz erfolgt über Row-Level-Security).

## Supabase einrichten

1. **Tabelle + RLS anlegen:** In Supabase → *SQL Editor* den Inhalt von
   [`supabase/schema.sql`](supabase/schema.sql) ausführen (legt `app_state`
   inkl. Row-Level-Security an).
2. **Google als Login-Provider aktivieren:** Supabase → *Authentication →
   Providers → Google* aktivieren und Client-ID + Secret eines Google-OAuth-
   Clients eintragen.
3. **Redirect-URLs setzen:** Supabase → *Authentication → URL Configuration* →
   die App-URL (z. B. `https://janschulten.github.io/FlowDHS/`) als *Site URL*
   und unter *Redirect URLs* eintragen.

## Google Cloud (für Login + Kalender)

1. [Google Cloud Console](https://console.cloud.google.com/) → Projekt anlegen.
2. **APIs aktivieren:** *Google Calendar API*.
3. **OAuth-Consent-Screen** konfigurieren und den Scope
   `.../auth/calendar.events` hinzufügen.
4. **OAuth-Client-ID** (Typ „Webanwendung“) erstellen:
   - *Autorisierte Weiterleitungs-URI:*
     `https://<dein-projekt>.supabase.co/auth/v1/callback`
   - *Autorisierte JavaScript-Quelle:* die App-URL
5. Client-ID + Secret in Supabase (Schritt 2 oben) eintragen.

Danach: App öffnen → *Einstellungen → Konto* → **Mit Google anmelden**. Ab dann
synchronisieren Projekte automatisch, und unter *Google-Kalender* kannst du
Termine importieren bzw. die heutigen Blöcke exportieren.

## Architektur

```
src/
  config.ts       Supabase-Verbindung (URL + publishable key)
  lib/            supabase client
  types/          Datenmodelle (Project, Subtask, Schedule, Gamification, …)
  engine/         planner · gamification · breakdown · auth · cloud · calendar · utils
  store/          useReducer + localStorage + Cloud-Snapshot (reducer.ts, useStore.ts)
  components/     layout · ui · pages · projects · board · auth
  styles/         tokens.css (Design-Tokens) · base.css
supabase/
  schema.sql      Tabelle app_state + Row-Level-Security
```

State: `useReducer` + `localStorage`, gespiegelt nach Supabase (JSONB-Snapshot
pro User). Laufzeit-Abhängigkeiten: `react`, `lucide-react`,
`@supabase/supabase-js`. Der Google-Kalender wird per REST mit dem
Provider-Token aus dem Google-Login angesprochen.
