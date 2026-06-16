import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (label: string) => void;
}

export function QuickTaskModal({ open, onClose, onSave }: Props) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (open) setLabel('');
  }, [open]);

  const handleSave = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  const footer = (
    <>
      <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
      <button className="btn btn-pri" onClick={handleSave}>
        <Check size={14} /> Speichern
      </button>
    </>
  );

  return (
    <Modal open={open} title="Neue Quick-Task" onClose={onClose} footer={footer}>
      <div className="form-group">
        <label className="form-label" htmlFor="qtm-label">Was ist zu tun? *</label>
        <input
          id="qtm-label"
          className="input"
          placeholder="z. B. Wäsche aufhängen, Mail beantworten …"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoComplete="off"
        />
        <div className="form-hint">
          Quick-Tasks sind einfache Häkchen-Aufgaben ohne festen Zeitplan — der Planer verplant sie nicht.
        </div>
      </div>
    </Modal>
  );
}
