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

**Datenbank: Google Sheets**
Alle Projekte können in deine eigene Google-Tabelle synchronisiert werden
(Lesen & Schreiben) — wie eine kleine Datenbank. Lokal bleibt `localStorage`
die Quelle, Google Sheets ist die optionale Sync-/Backup-Ebene.

## Entwicklung

```bash
npm install
npm run dev
npm run build
```

## Google-Sheets-Sync einrichten

1. In der [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   ein Projekt anlegen.
2. **Google Sheets API** aktivieren und eine **OAuth-Client-ID** (Typ
   „Webanwendung“) erstellen. Die URL der laufenden App unter „Autorisierte
   JavaScript-Quellen“ eintragen.
3. In FocusFlow → *Einstellungen* die Client-ID und den Link eines eigenen
   (leeren) Google Sheets eintragen.
4. „Hochladen“ klicken → mit Google anmelden. FocusFlow legt die Tabs
   `Projects` und `Subtasks` an und hält sie aktuell.

## Architektur

```
src/
  types/          Datenmodelle (Project, Subtask, Schedule, Gamification, …)
  engine/         planner · gamification · breakdown · sheets · utils
  store/          useReducer + localStorage (reducer.ts, useStore.ts)
  components/     layout · ui · pages · projects · board · sync
  styles/         tokens.css (Design-Tokens) · base.css
```

State: `useReducer` + `localStorage` (kein Redux). Einzige Laufzeit-Abhängigkeit
neben React ist `lucide-react`; Google Identity Services wird bei Bedarf
dynamisch geladen.
