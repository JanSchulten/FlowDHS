interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  'aria-label'?: string;
}

export function Toggle({ checked, onChange, 'aria-label': ariaLabel }: Props) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel}
      />
      <div className="toggle-track" />
    </label>
  );
}
