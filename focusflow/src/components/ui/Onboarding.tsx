import { useState } from 'react';

interface Props {
  open: boolean;
  onFinish: () => void;
}

const STEPS = [
  {
    illu: '🧠',
    title: 'Willkommen bei FocusFlow',
    body: 'Ein Planer, der für ADHS-Gehirne gebaut ist: weniger Reizüberflutung, mehr Dopamin, kein Schuld-Gefühl.',
    features: [] as { ico: string; h: string; p: string }[],
  },
  {
    illu: '⚡',
    title: 'Vier Werkzeuge gegen die typischen Hürden',
    body: '',
    features: [
      { ico: '🧠', h: 'Brain-Dump', p: 'Gedanken sofort rauswerfen, später sortieren — entlastet das Arbeitsgedächtnis.' },
      { ico: '🪓', h: 'Aufgaben zerlegen', p: 'Große Brocken in winzige Schritte — gegen die Start-Blockade.' },
      { ico: '⏳', h: 'Zeit sichtbar machen', p: 'Ringe & „Jetzt / Als Nächstes“ gegen Zeitblindheit.' },
      { ico: '🏆', h: 'Belohnungen', p: 'XP, Level & Konfetti — Motivation über das Dopamin-System.' },
    ],
  },
  {
    illu: '🚀',
    title: 'Los geht’s',
    body: 'Deine Daten bleiben lokal — optional synchronisierst du sie in deine eigene Google-Tabelle. Du kannst jederzeit alles in den Einstellungen anpassen.',
    features: [],
  },
];

export function Onboarding({ open, onFinish }: Props) {
  const [step, setStep] = useState(0);
  if (!open) return null;
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className="overlay open" role="dialog" aria-modal="true" aria-label="Einführung">
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="onb-steps">
          {STEPS.map((_, i) => <div key={i} className={`onb-dot ${i <= step ? 'active' : ''}`} />)}
        </div>
        <div className="onb-illu">{s.illu}</div>
        <h2 className="modal-title" style={{ textAlign: 'center' }}>{s.title}</h2>
        {s.body && <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--tx2)', textAlign: 'center', marginTop: '.5rem' }}>{s.body}</p>}

        {s.features.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            {s.features.map((f) => (
              <div className="onb-feat" key={f.h}>
                <span className="onb-feat-ico">{f.ico}</span>
                <div className="onb-feat-txt"><h4>{f.h}</h4><p>{f.p}</p></div>
              </div>
            ))}
          </div>
        )}

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-ghost" onClick={onFinish}>Überspringen</button>
          <button
            className="btn btn-pri"
            onClick={() => (last ? onFinish() : setStep((x) => x + 1))}
          >
            {last ? 'Loslegen 🚀' : 'Weiter'}
          </button>
        </div>
      </div>
    </div>
  );
}
