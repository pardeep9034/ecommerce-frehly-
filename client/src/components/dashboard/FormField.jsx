import { labelClass } from "@/lib/formStyles";

// Label + control + hint/error stack. Pass the control as children and give it the same `id`.
const FormField = ({ id, label, hint, error, children, className = "" }) => (
  <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
    {label && (
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
    )}
    {children}
    {error ? (
      <span id={`${id}-error`} className="text-xs font-medium text-destructive">
        {error}
      </span>
    ) : (
      hint && <span className="text-xs text-muted-foreground">{hint}</span>
    )}
  </div>
);

export default FormField;
