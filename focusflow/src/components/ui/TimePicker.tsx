import { useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  value: string; // 'HH:MM'
  onChange: (v: string) => void;
  label?: string;
  id?: string;
}

export function TimePicker({ value, onChange, label, id }: Props) {
  const [hStr, mStr] = value.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = parseInt(mStr ?? '0', 10);

  const hRef = useRef<HTMLDivElement>(null);
  const mRef = useRef<HTMLDivElement>(null);

  const emit = (newH: number, newM: number) => {
    const ch = Math.max(0, Math.min(23, newH));
    const cm = Math.max(0, Math.min(55, Math.round(newM / 5) * 5));
    onChange(`${String(ch).padStart(2, '0')}:${String(cm).padStart(2, '0')}`);
  };

  const onWheel = (which: 'h' | 'm') => (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    if (which === 'h') emit(h + delta, m);
    else emit(h, m + delta * 5);
  };

  const onKey = (which: 'h' | 'm') => (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); which === 'h' ? emit(h + 1, m) : emit(h, m + 5); }
    if (e.key === 'ArrowDown') { e.preventDefault(); which === 'h' ? emit(h - 1, m) : emit(h, m - 5); }
  };

  return (
    <div className="time-picker">
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <div className="time-picker-wrap" id={id}>
        {/* Hours segment */}
        <div className="time-seg" ref={hRef} onWheel={onWheel('h')} onKeyDown={onKey('h')} tabIndex={0} role="spinbutton" aria-valuenow={h} aria-valuemin={0} aria-valuemax={23} aria-label="Stunden">
          <button className="time-seg-arrow" onClick={() => emit(h + 1, m)} tabIndex={-1} aria-label="Stunde erhöhen"><ChevronUp size={13} /></button>
          <div className="time-seg-val">{String(h).padStart(2, '0')}</div>
          <button className="time-seg-arrow" onClick={() => emit(h - 1, m)} tabIndex={-1} aria-label="Stunde verringern"><ChevronDown size={13} /></button>
        </div>

        <div className="time-colon">:</div>

        {/* Minutes segment */}
        <div className="time-seg" ref={mRef} onWheel={onWheel('m')} onKeyDown={onKey('m')} tabIndex={0} role="spinbutton" aria-valuenow={m} aria-valuemin={0} aria-valuemax={55} aria-label="Minuten">
          <button className="time-seg-arrow" onClick={() => emit(h, m + 5)} tabIndex={-1} aria-label="Minute erhöhen"><ChevronUp size={13} /></button>
          <div className="time-seg-val">{String(m).padStart(2, '0')}</div>
          <button className="time-seg-arrow" onClick={() => emit(h, m - 5)} tabIndex={-1} aria-label="Minute verringern"><ChevronDown size={13} /></button>
        </div>
      </div>
    </div>
  );
}
