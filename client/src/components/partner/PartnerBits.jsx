import { Check } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { DELIVERY_STEPS, STATUS_STYLE } from "@/lib/assignmentStatus";

export const StatusPill = ({ status, className = "" }) => (
  <span
    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[status] || "bg-muted text-muted-foreground"} ${className}`}
  >
    {status}
  </span>
);

export const Avatar = ({ initials, className = "h-9 w-9 text-xs" }) => (
  <span
    className={`flex shrink-0 items-center justify-center rounded-full bg-accent/20 font-bold text-accent-foreground ${className}`}
  >
    {initials}
  </span>
);

// Round icon that opens a link: tel: to call, or a maps URL in a new tab.
export const RoundLink = ({ href, label, icon }) => {
  const Icon = icon;
  return (
    <a
      href={href}
      aria-label={label}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
};

// Shown until a screen's data has loaded (or when it can't: someone else's assignment and a missing one both answer 404).
// Under an action's buttons while it runs (useJobAction's phase, or "saving" for a plain pending mutation).
export const SavingNote = ({ phase }) =>
  phase && phase !== "idle" ? (
    <p role="status" className="text-center text-xs font-semibold text-muted-foreground">
      {phase === "checking" ? "Still saving. Checking whether it went through…" : "Saving… don’t close the app"}
    </p>
  ) : null;

export const LoadNote =({ error, what = "this order" }) => (
  <p className={`text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>
    {error ? `Couldn’t load ${what}. Go back and try again.` : "Loading…"}
  </p>
);

export const DemoNote = ({ children = "Partner screens run on demo data — the backend doesn't serve them yet." }) => (
  <p className="text-[11px] text-muted-foreground">{children}</p>
);

// Assigned → Picked up → On the way → Delivered. `step` is the index of the current stage.
export const Stepper = ({ step }) => (
  <ol aria-label="Delivery progress" className="flex items-start">
    {DELIVERY_STEPS.map((label, i) => (
      <li key={label} className="flex flex-1 flex-col items-center gap-1.5 text-center">
        <div className="flex w-full items-center">
          <span className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : i <= step ? "bg-primary" : "bg-border"}`} />
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
              i < step ? "bg-primary text-white" : i === step ? "bg-accent text-accent-foreground" : "bg-border text-muted-foreground"
            }`}
          >
            {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </span>
          <span className={`h-0.5 flex-1 ${i === DELIVERY_STEPS.length - 1 ? "bg-transparent" : i < step ? "bg-primary" : "bg-border"}`} />
        </div>
        <span className={`text-[11px] ${i <= step ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</span>
      </li>
    ))}
  </ol>
);

// Vertical event log. Dot is filled by default; `current` = accent, `pending` = hollow and muted.
export const Timeline = ({ items }) => (
  <ol className="space-y-3">
    {items.map((it, i) => (
      <li key={`${i}-${it.title}`} className="flex gap-3">
        <span
          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 ${
            it.pending ? "border-border bg-white" : it.current ? "border-accent bg-accent" : "border-primary bg-primary"
          }`}
        />
        <div>
          <p className={`text-sm font-semibold ${it.pending ? "text-muted-foreground" : "text-foreground"}`}>
            {it.title}
          </p>
          <p className="text-xs text-muted-foreground">{it.sub}</p>
        </div>
      </li>
    ))}
  </ol>
);

export const Card = ({ className = "", children, ...rest }) => (
  <section {...rest} className={`rounded-xl border border-border bg-white p-4 shadow-card ${className}`}>{children}</section>
);

// Row of digit boxes for the sign-in OTP (6) and the customer's delivery code (4).
export const CodeInput = ({ length, value, onChange, label }) => (
  <InputOTP maxLength={length} value={value} onChange={onChange} pattern={REGEXP_ONLY_DIGITS} aria-label={label} containerClassName="w-full">
    <InputOTPGroup className="w-full gap-2">
      {Array.from({ length }, (_, i) => (
        <InputOTPSlot key={i} index={i} className="h-12 flex-1 rounded-lg border border-border bg-white text-lg font-semibold first:rounded-l-lg last:rounded-r-lg" />
      ))}
    </InputOTPGroup>
  </InputOTP>
);

// "1 · Details / 2 · Documents / 3 · Review" bar on the self-onboarding screens.
export const ApplySteps = ({ current }) => (
  <ol aria-label="Application steps" className="grid grid-cols-3 gap-2">
    {["Details", "Documents", "Review"].map((label, i) => (
      <li key={label} className={`rounded-full py-1.5 text-center text-[11px] font-semibold ${i + 1 <= current ? "bg-primary text-white" : "bg-border text-muted-foreground"}`}>
        {i + 1} · {label}
      </li>
    ))}
  </ol>
);
