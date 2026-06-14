interface Props {
  progress: number; // 0..1 remaining
  timeLabel: string;
  stateLabel: string;
  isBreak: boolean;
  size?: number;
}

/** Circular countdown — a concrete, shrinking visual of remaining time (time-blindness aid). */
export function TimeRing({ progress, timeLabel, stateLabel, isBreak, size = 240 }: Props) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <div className="timering-wrap" style={{ width: size, height: size }} aria-hidden="false">
      <svg className="timering" width={size} height={size}>
        <circle className="timering-bg" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle
          className={`timering-fg ${isBreak ? 'break' : ''}`}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="timering-label">
        <div>
          <div className="timering-time">{timeLabel}</div>
          <div className="timering-state">{stateLabel}</div>
        </div>
      </div>
    </div>
  );
}
