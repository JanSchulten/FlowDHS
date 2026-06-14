import { levelFromXp, levelTitle } from '../../engine/gamification';

interface Props {
  xp: number;
  onClick?: () => void;
}

export function LevelWidget({ xp, onClick }: Props) {
  const { level, curBase, nextAt, progress } = levelFromXp(xp);
  const into = xp - curBase;
  const span = nextAt - curBase;

  return (
    <button
      className="level-badge"
      onClick={onClick}
      title={`${levelTitle(level)} · ${xp} XP`}
      aria-label={`Level ${level}, ${levelTitle(level)}, ${xp} Erfahrungspunkte`}
    >
      <span className="level-ring">{level}</span>
      <span className="level-xp">
        <span className="level-xp-track">
          <span className="level-xp-fill" style={{ width: `${progress * 100}%` }} />
        </span>
        <span className="level-xp-label">{into}/{span} XP</span>
      </span>
    </button>
  );
}
