'use client';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  name?: string;
}

/**
 * Labeled toggle with a visible bordered container and a clear on/off state.
 * Prefer this over a bare `toggle` input so every switch has a labeled,
 * tappable, clearly bounded hit area.
 */
export default function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  name,
}: SwitchProps) {
  return (
    <label className={`flex items-center justify-between gap-4 cursor-pointer rounded-box border border-base-300 p-4 ${disabled ? 'opacity-60' : ''}`}>
      <span className="flex flex-col gap-1">
        <span className="text-sm font-medium">{label}</span>
        {description && <span className="text-xs text-base-content/60">{description}</span>}
      </span>
      <input
        type="checkbox"
        name={name}
        className="toggle toggle-primary"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
