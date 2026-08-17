interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TextField({ label, value, onChange, placeholder }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-black/70">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-black/10 px-3 py-2 text-sm text-black outline-none focus:border-brand"
      />
    </label>
  );
}

export function TextAreaField({ label, value, onChange, placeholder }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-black/70">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="rounded-lg border border-black/10 px-3 py-2 text-sm text-black outline-none focus:border-brand"
      />
    </label>
  );
}

interface CheckboxGroupFieldProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function CheckboxGroupField({ label, options, value, onChange }: CheckboxGroupFieldProps) {
  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-black/70">{label}</span>
      <div className="flex flex-col gap-2 rounded-lg border border-black/10 px-3 py-2.5">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2.5 text-sm text-black/80">
            <input
              type="checkbox"
              checked={value.includes(option)}
              onChange={() => toggle(option)}
              className="size-4 rounded border-black/20 accent-brand"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}
