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
