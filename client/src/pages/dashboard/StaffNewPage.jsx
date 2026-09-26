import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, CheckCircle2, Copy, Eye, EyeOff, Info, KeyRound, MessageSquare, RefreshCw, ShieldCheck } from "lucide-react";
import FormField from "@/components/dashboard/FormField";
import DemoBadge from "@/components/dashboard/DemoBadge";
import useStaff, { useStaffDetail } from "@/hooks/use-staff";
import useWarehouse from "@/hooks/use-warehouse";
import { notify } from "@/lib/notify";
import { DEMO_NOTICE, SHIFT_OPTIONS, isApiMissing } from "@/lib/demoData";
import { PASSWORD_RULES, STRENGTH_LABELS, generatePassword, passwordScore } from "@/lib/password";
import { ROLE_ACCESS, ROLE_DESCRIPTIONS, ROLE_LABELS, STAFF_ROLES, fullName } from "@/lib/staffRole";
import { cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/formStyles";

const EMPTY_USER = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  role: "OPS_STAFF",
  warehouse_id: "",
  shift: "MORNING",
  password_method: "set",
  password: "",
  must_change_password: true,
};

const STRENGTH_COLORS = ["bg-destructive", "bg-destructive", "bg-warning", "bg-primary", "bg-primary"];

const validate = (form, isEdit) => {
  const errors = {};
  if (!form.first_name.trim()) errors.first_name = "Enter a first name";
  if (!form.last_name.trim()) errors.last_name = "Enter a last name";
  if (!/^\+?[\d\s-]{10,15}$/.test(form.phone.trim())) errors.phone = "Enter a 10-digit mobile number";
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Enter a valid email";
  if (!isEdit && form.password_method === "set" && passwordScore(form.password) < 3) errors.password = "Use a stronger password";
  return errors;
};

const loginUrl = (role) => `${window.location.origin}${role === "SUPER_ADMIN" ? "/admin/login" : "/store/login"}`;

const StaffNewPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEdit = Boolean(editId);

  const [form, setForm] = useState(() => ({ ...EMPTY_USER, password: generatePassword() }));
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(true);
  const [result, setResult] = useState(null); // { user, password, method, saved }
  const [revealResult, setRevealResult] = useState(true);

  const { allStaff, isDemo, createMutation, updateMutation, resendInviteMutation } = useStaff(1, 100);
  const { user: fetchedUser } = useStaffDetail(editId);
  const { warehouses } = useWarehouse(1, 100);
  const existing = fetchedUser ?? (isEdit ? allStaff.find((user) => String(user.id) === editId) : null);

  useEffect(() => {
    if (!existing) return;
    setForm((current) => ({
      ...current,
      first_name: existing.first_name || "",
      last_name: existing.last_name || "",
      phone: existing.phone || "",
      email: existing.email || "",
      role: existing.role || "OPS_STAFF",
      warehouse_id: existing.warehouse_id ? String(existing.warehouse_id) : "",
      shift: existing.shift || "MORNING",
    }));
  }, [existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const score = passwordScore(form.password);
  const isStoreRole = form.role !== "SUPER_ADMIN";
  const warehouse = warehouses.find((item) => String(item.id) === form.warehouse_id);
  const name = fullName(form);

  const payload = () => ({
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    phone: form.phone.replace(/[\s-]/g, ""),
    email: form.email.trim() || undefined,
    role: form.role,
    warehouse_id: isStoreRole && form.warehouse_id ? Number(form.warehouse_id) : null,
    shift: isStoreRole ? form.shift : undefined,
  });

  const submit = (event) => {
    event.preventDefault();
    const found = validate(form, isEdit);
    setErrors(found);
    if (Object.keys(found).length) return;

    if (isEdit) {
      if (isDemo || Number(editId) < 0) return notify.info(DEMO_NOTICE);
      updateMutation.mutate({ id: editId, data: payload() }, { onSuccess: () => navigate("/dashboard/staff") });
      return;
    }

    const data = {
      ...payload(),
      password_method: form.password_method,
      ...(form.password_method === "set" && { password: form.password, must_change_password: form.must_change_password }),
    };
    const done = (user, saved) => setResult({ user, saved, method: form.password_method, password: form.password });
    createMutation.mutate(data, {
      onSuccess: (response) => done(response?.data ?? data, true),
      onError: (error) => isApiMissing(error) && done(data, false),
    });
  };

  const startOver = () => {
    setResult(null);
    setErrors({});
    setForm({ ...EMPTY_USER, password: generatePassword() });
  };

  if (result) {
    const { user, saved, method, password } = result;
    const where = warehouse ? warehouse.name : isStoreRole ? "No warehouse yet" : "All warehouses";
    const details = [
      `Freshly login for ${fullName(user)}`,
      `Login ID: ${user.phone}`,
      method === "set" && `Temporary password: ${password}`,
      `Log in at: ${loginUrl(user.role)}`,
    ].filter(Boolean).join("\n");

    return (
      <div className="mx-auto flex max-w-[560px] flex-col gap-4 py-4">
        {!saved && (
          <div role="status" className="flex items-center gap-2.5 rounded-xl bg-accent/20 px-3.5 py-3 text-[13px] text-foreground">
            <DemoBadge title="POST /auth/admin/users doesn't exist yet." />
            Preview only: this user was not saved. The backend API is needed first.
          </div>
        )}
        <section className={`${cardClass} items-center text-center`}>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-xl font-bold text-foreground">{saved ? `${fullName(user)} can now log in` : `${fullName(user)}’s login details`}</h1>
            <p className="text-sm text-muted-foreground">{ROLE_LABELS[user.role]} · {where}</p>
          </div>
          <dl className="m-0 flex w-full flex-col gap-3 rounded-xl bg-muted p-4 text-left">
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Login ID (mobile)</dt>
              <dd className="m-0 font-semibold text-foreground">{user.phone}</dd>
            </div>
            {method === "set" ? (
              <div className="flex flex-col gap-0.5">
                <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                  Temporary password <span className="font-semibold text-warning">Shown only now</span>
                </dt>
                <dd className="m-0 flex items-center gap-2">
                  <span className="flex-1 font-mono text-lg font-bold tracking-wide text-foreground">
                    {revealResult ? password : "•".repeat(password.length)}
                  </span>
                  <button type="button" aria-label={revealResult ? "Hide password" : "Show password"} onClick={() => setRevealResult(!revealResult)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-border hover:text-foreground">
                    {revealResult ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </dd>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Password</dt>
                <dd className="m-0 text-sm text-foreground">A set-password link was sent by SMS to {user.phone}.</dd>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Where to log in</dt>
              <dd className="m-0 break-all text-sm font-semibold text-foreground">{loginUrl(user.role)}</dd>
            </div>
          </dl>
          <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(details).then(() => notify.success("Login details copied"))}
              className={secondaryButtonClass}
            >
              <Copy className="h-4 w-4" aria-hidden="true" /> Copy login details
            </button>
            <button
              type="button"
              onClick={() =>
                saved && user.id
                  ? resendInviteMutation.mutate(user.id, { onSuccess: () => notify.success(`Sent to ${user.phone}`) })
                  : notify.info(DEMO_NOTICE)
              }
              className={secondaryButtonClass}
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" /> Send by SMS
            </button>
            <button type="button" onClick={startOver} className={secondaryButtonClass}>Add another user</button>
            <Link to="/dashboard/staff" className={primaryButtonClass}>Go to staff list</Link>
          </div>
        </section>
      </div>
    );
  }

  const text = (key, props = {}) => ({
    id: `user-${key}`,
    value: form[key],
    onChange: (event) => setField(key, event.target.value),
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `user-${key}-error` : undefined,
    className: inputClass,
    ...props,
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link to="/dashboard/staff" className="font-medium hover:text-foreground">Staff &amp; admins</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-foreground">{isEdit ? `Edit ${name}` : "Add user"}</span>
      </nav>

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <section className={cardClass}>
            <h2 className="font-display text-base font-bold text-foreground">1 · Personal details</h2>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <FormField id="user-first_name" label="First name" error={errors.first_name}>
                <input type="text" autoComplete="off" {...text("first_name")} />
              </FormField>
              <FormField id="user-last_name" label="Last name" error={errors.last_name}>
                <input type="text" autoComplete="off" {...text("last_name")} />
              </FormField>
              <FormField id="user-phone" label="Mobile (login ID)" hint={isEdit ? "The login ID can't be changed" : "They sign in with this number"} error={errors.phone}>
                <input type="tel" inputMode="tel" placeholder="+91 98765 43210" disabled={isEdit} {...text("phone")} />
              </FormField>
              <FormField id="user-email" label="Email (optional)" error={errors.email}>
                <input type="email" autoComplete="off" {...text("email")} />
              </FormField>
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="font-display text-base font-bold text-foreground">2 · Role</h2>
            <div role="radiogroup" aria-label="Role" className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              {STAFF_ROLES.map((role) => {
                const active = form.role === role;
                return (
                  <button
                    key={role}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setField("role", role)}
                    className={`flex flex-col gap-1.5 rounded-xl border-[1.5px] p-3.5 text-left transition-colors ${active ? "border-primary bg-secondary" : "border-border hover:bg-muted/60"}`}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 ${active ? "border-primary" : "border-border"}`}>
                        {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </span>
                      {ROLE_LABELS[role]}
                    </span>
                    <span className="text-xs leading-relaxed text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</span>
                  </button>
                );
              })}
            </div>
            {isStoreRole ? (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <FormField id="user-warehouse_id" label="Warehouse" hint="Each person works at one warehouse at a time">
                  <select {...text("warehouse_id")}>
                    <option value="">Not assigned yet</option>
                    {warehouses.map((item) => (
                      <option key={item.id} value={String(item.id)}>{item.name}</option>
                    ))}
                  </select>
                </FormField>
                <FormField id="user-shift" label="Shift">
                  <select {...text("shift")}>
                    {SHIFT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </FormField>
              </div>
            ) : (
              <div className="flex gap-2.5 rounded-xl bg-purple-50 px-3.5 py-3 text-[13px] text-foreground">
                <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-purple-700" aria-hidden="true" />
                Super admins aren’t tied to a warehouse. They pick a store in the console and can create other users.
              </div>
            )}
          </section>

          {!isEdit && (
            <section className={cardClass}>
              <h2 className="font-display text-base font-bold text-foreground">3 · Login &amp; password</h2>
              <div role="radiogroup" aria-label="How they get a password" className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {[
                  { value: "set", icon: KeyRound, title: "Set a password now", note: "You share it with them. Good for people standing next to you." },
                  { value: "link", icon: MessageSquare, title: "Send a set-password link by SMS", note: "They choose their own password from their phone." },
                ].map((option) => {
                  const active = form.password_method === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setField("password_method", option.value)}
                      className={`flex gap-3 rounded-xl border-[1.5px] p-3.5 text-left transition-colors ${active ? "border-primary bg-secondary" : "border-border hover:bg-muted/60"}`}
                    >
                      <option.icon className={`mt-0.5 h-5 w-5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                      <span className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-foreground">{option.title}</span>
                        <span className="text-xs text-muted-foreground">{option.note}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {form.password_method === "set" ? (
                <div className="flex flex-col gap-3">
                  <FormField id="user-password" label="Temporary password" error={errors.password}>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        spellCheck={false}
                        {...text("password", { className: `${inputClass} pr-24 font-mono tracking-wide` })}
                      />
                      <span className="absolute right-1.5 top-1/2 flex -translate-y-1/2 gap-0.5">
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="rounded-lg px-2 py-1.5 text-[13px] font-semibold text-primary hover:bg-secondary">
                          {showPassword ? "Hide" : "Show"}
                        </button>
                        <button type="button" aria-label="Generate a new password" onClick={() => setField("password", generatePassword())} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </span>
                    </div>
                  </FormField>
                  <div className="flex items-center gap-3">
                    <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
                      {[1, 2, 3, 4].map((step) => (
                        <span key={step} className={`h-1.5 rounded-full ${score >= step ? STRENGTH_COLORS[score] : "bg-border"}`} />
                      ))}
                    </div>
                    <span className="w-16 text-right text-[13px] font-semibold text-foreground" aria-live="polite">{STRENGTH_LABELS[score]}</span>
                  </div>
                  <ul className="m-0 grid list-none grid-cols-2 gap-1.5 p-0 text-[13px] sm:grid-cols-4">
                    {PASSWORD_RULES.map((rule) => {
                      const met = rule.test(form.password);
                      return (
                        <li key={rule.label} className={`flex items-center gap-1.5 ${met ? "text-primary" : "text-muted-foreground"}`}>
                          <Check className={`h-3.5 w-3.5 ${met ? "" : "opacity-30"}`} aria-hidden="true" />
                          {rule.label}
                          <span className="sr-only">{met ? "(met)" : "(not met)"}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <label className="flex items-center gap-2.5 text-sm text-foreground">
                    <input type="checkbox" checked={form.must_change_password} onChange={(event) => setField("must_change_password", event.target.checked)} className="h-5 w-5 accent-primary" />
                    Must change password at first login
                  </label>
                </div>
              ) : (
                <div className="flex gap-2.5 rounded-xl bg-blue-50 px-3.5 py-3 text-[13px] text-foreground">
                  <MessageSquare className="h-[18px] w-[18px] shrink-0 text-blue-700" aria-hidden="true" />
                  We’ll text a link to {form.phone.trim() || "their mobile"}. It works once and expires in 24 hours. Until they set a password, they show as “Invite sent”.
                </div>
              )}
            </section>
          )}

          <div className="flex flex-wrap justify-end gap-2.5">
            <Link to="/dashboard/staff" className={secondaryButtonClass}>Cancel</Link>
            {isEdit ? (
              <button type="submit" disabled={updateMutation.isPending} className={primaryButtonClass}>
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </button>
            ) : (
              <button type="submit" disabled={createMutation.isPending || (form.password_method === "set" && score < 3)} className={primaryButtonClass}>
                {createMutation.isPending ? "Creating…" : form.password_method === "set" && score < 3 ? "Use a stronger password" : "Create user"}
              </button>
            )}
          </div>
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <section className={cardClass}>
            <h2 className="font-display text-base font-bold text-foreground">Access summary</h2>
            <p className="text-sm font-semibold text-foreground">{name === "—" ? "This user" : name} · {ROLE_LABELS[form.role]}</p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-sm text-foreground">
              {ROLE_ACCESS[form.role].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {isStoreRole && item === "One warehouse" && warehouse ? warehouse.name : item}
                </li>
              ))}
            </ul>
            {isStoreRole && (
              <p className="text-[13px] text-muted-foreground">Logs in at {loginUrl(form.role)}</p>
            )}
          </section>
          <div className="flex gap-2.5 rounded-xl bg-blue-50 px-3.5 py-3 text-[13px] leading-relaxed text-foreground">
            <Info className="h-[18px] w-[18px] shrink-0 text-blue-700" aria-hidden="true" />
            Passwords are stored hashed, so no one can see them later. After 5 wrong tries the account locks for 2 hours.
          </div>
        </aside>
      </div>
    </form>
  );
};

export default StaffNewPage;
