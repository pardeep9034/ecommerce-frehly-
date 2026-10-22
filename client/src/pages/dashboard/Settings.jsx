import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { changePassword, getProfile, logoutOtherDevices, requestPhoneChangeOtp, updateProfile } from "@/apis/authApi";
import configApi from "@/apis/configApi";
import useNotificationPreferences from "@/hooks/use-notificationPreferences";
import { getToken, getTokenRole } from "@/lib/tokenStorage";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/dashboard/PageHeader";

// General and Order rules save to config-service (GET /config, PATCH /config/:group); order-service
// reads the payment window from there. My account saves through PUT /auth/profile and PUT /auth/password;
// "Sign out everywhere else" is POST /auth/logout/others. Notifications use notification-service
// (GET / PATCH /notifications/preferences/me), which answers 403 to anyone but ADMIN and SUPER_ADMIN.
const NOTIFICATION_ROLES = ["ADMIN", "SUPER_ADMIN"];
const TABS = [
  { key: "general", label: "General" },
  { key: "orders", label: "Order rules" },
  { key: "security", label: "My account & security" },
  { key: "notifications", label: "Notifications" },
];

const Toggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const Card = ({ title, children }) => (
  <div className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-card">
    <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, ...props }) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-medium text-foreground">{label}</span>
    <Input {...props} />
  </label>
);

// A validation reply names the field; other errors carry a message.
const errorText = (error, fallback) =>
  error?.response?.data?.errors?.[0]?.message || error?.response?.data?.message || fallback;

const Settings = () => {
  const [tab, setTab] = useState("general");
  const user = useSelector((state) => state.auth.user);
  const queryClient = useQueryClient();

  // Saved settings, plus the fields edited since (per group). Saving sends only the edited fields.
  const { data: saved, isLoading: settingsLoading } = useQuery({ queryKey: ["settings"], queryFn: configApi.getAll });
  const [edits, setEdits] = useState({ general: {}, orderRules: {} });
  const general = { ...saved?.general, ...edits.general };
  const orderRules = { ...saved?.orderRules, ...edits.orderRules };
  const setGeneral = (update) => setEdits((e) => ({ ...e, general: update({ ...e.general }) }));
  const setOrderRules = (update) => setEdits((e) => ({ ...e, orderRules: update({ ...e.orderRules }) }));

  const saveGroup = useMutation({
    mutationFn: (group) => configApi.save(group, edits[group]),
    onSuccess: (values, group) => {
      queryClient.setQueryData(["settings"], (old) => ({ ...old, [group]: values }));
      setEdits((e) => ({ ...e, [group]: {} }));
      toast.success("Settings saved");
    },
    onError: (error) => toast.error(errorText(error, "Unable to save the settings")),
  });
  const save = (group) => {
    if (!Object.keys(edits[group]).length) return toast("No changes to save");
    saveGroup.mutate(group);
  };

  // Same idea as the config groups: saved preferences plus edited switches; Save sends only the switches that differ.
  const canNotify = NOTIFICATION_ROLES.includes(getTokenRole(getToken()));
  const { preferences, isLoading: preferencesLoading, updateMutation: savePreferences } = useNotificationPreferences({ enabled: canNotify });
  const [notificationEdits, setNotificationEdits] = useState({});
  const notifications = { ...preferences, ...notificationEdits };
  const setNotifications = (update) => setNotificationEdits((e) => update({ ...e }));
  const onSaveNotifications = () => {
    const changes = Object.fromEntries(Object.entries(notificationEdits).filter(([key, value]) => value !== preferences[key]));
    if (!Object.keys(changes).length) return toast("No changes to save");
    savePreferences.mutate(changes, {
      onSuccess: () => {
        setNotificationEdits({});
        toast.success("Notification settings saved");
      },
      onError: (error) => toast.error(errorText(error, "Unable to save the notification settings")),
    });
  };

  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });

  // Both keep this device signed in and end the other sessions.
  const updatePassword = useMutation({
    mutationFn: () => changePassword(passwordForm.current, passwordForm.next),
    onSuccess: ({ data }) => {
      setPasswordForm({ current: "", next: "", confirm: "" });
      const n = data?.signed_out_sessions;
      toast.success(n ? `Password changed. Signed out of ${n} other session${n === 1 ? "" : "s"}.` : "Password changed");
    },
    onError: (error) => toast.error(errorText(error, "Unable to change the password")),
  });
  const onChangePassword = (event) => {
    event.preventDefault();
    if (!passwordForm.current || !passwordForm.next) return toast.error("Enter your current and new password");
    if (passwordForm.next !== passwordForm.confirm) return toast.error("The new passwords don't match");
    updatePassword.mutate();
  };

  const signOutOthers = useMutation({
    mutationFn: logoutOtherDevices,
    onSuccess: (result) => toast.success(result.message),
    onError: (error) => toast.error(errorText(error, "Unable to sign out the other sessions")),
  });

  const { data: profile } = useQuery({ queryKey: ["auth-profile"], queryFn: getProfile });
  const profileName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || user?.name || "";
  // Only edited fields are set, so an emptied field stays empty instead of snapping back.
  const [account, setAccount] = useState({});
  const [otp, setOtp] = useState({ sentTo: null, code: "" }); // a mobile change needs the code sent to the new number

  const effectiveAccount = {
    name: account.name ?? profileName,
    email: account.email ?? (profile?.email || user?.email || ""),
    mobile: account.mobile ?? (profile?.phone || user?.phone || ""),
  };
  const newMobile = effectiveAccount.mobile.replace(/\D/g, "").slice(-10); // accepts "+91 98…" too
  const mobileChanged = !!profile && newMobile !== profile.phone;

  const sendCode = useMutation({
    mutationFn: () => requestPhoneChangeOtp(newMobile),
    onSuccess: (result) => {
      setOtp({ sentTo: newMobile, code: "" });
      // The code only comes back in development (SMS prints to the server log).
      toast.success(result?.data?.otp ? `Code sent (dev: ${result.data.otp})` : `Code sent to +91 ${newMobile}`);
    },
    onError: (error) => toast.error(errorText(error, "Unable to send the code")),
  });

  const saveProfile = useMutation({
    mutationFn: () => {
      const [first_name, ...rest] = effectiveAccount.name.trim().split(/\s+/);
      return updateProfile({
        first_name,
        last_name: rest.join(" "),
        email: effectiveAccount.email.trim(),
        ...(mobileChanged && { phone: newMobile, otp: otp.code.trim() }),
      });
    },
    onSuccess: (fresh) => {
      queryClient.setQueryData(["auth-profile"], fresh);
      setAccount({});
      setOtp({ sentTo: null, code: "" });
      toast.success("Profile saved");
    },
    onError: (error) => toast.error(errorText(error, "Unable to save your profile")),
  });

  // A new mobile first gets a code; Save again with the code to finish.
  const onSaveProfile = () => {
    if (mobileChanged && otp.sentTo !== newMobile) {
      if (!/^\d{10}$/.test(newMobile)) return toast.error("Enter a 10-digit mobile number");
      return sendCode.mutate();
    }
    saveProfile.mutate();
  };

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader title="Settings" description="Store configuration, order rules and your account." />

      <div className="rounded-xl border border-border bg-white p-2 shadow-card">
        <div role="tablist" className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`h-9 rounded-lg px-3.5 text-sm font-semibold transition-colors ${
                tab === t.key ? "bg-primary text-white" : "text-foreground hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {(tab === "general" || tab === "orders") && !saved && (
        <p className="text-sm text-muted-foreground">{settingsLoading ? "Loading settings…" : "Unable to load the settings."}</p>
      )}

      {tab === "general" && saved && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card title="Business">
            <Field label="Business name" value={general.businessName} onChange={(e) => setGeneral((g) => ({ ...g, businessName: e.target.value }))} />
            <Field label="Support phone" value={general.supportPhone} onChange={(e) => setGeneral((g) => ({ ...g, supportPhone: e.target.value }))} />
            <Field label="Support email" value={general.supportEmail} onChange={(e) => setGeneral((g) => ({ ...g, supportEmail: e.target.value }))} />
            <Field label="GSTIN" placeholder="Optional" value={general.gstin} onChange={(e) => setGeneral((g) => ({ ...g, gstin: e.target.value }))} />
            <Button onClick={() => save("general")} disabled={saveGroup.isPending}>Save</Button>
          </Card>

          <Card title="Customer app">
            <Toggle label="Accept cash on delivery" checked={general.cod} onChange={(v) => setGeneral((g) => ({ ...g, cod: v }))} />
            <Toggle label="Show out-of-stock products" checked={general.showOutOfStock} onChange={(v) => setGeneral((g) => ({ ...g, showOutOfStock: v }))} />
            <Field
              label="Slot length (hours)"
              type="number"
              min="1"
              value={general.slotLength}
              onChange={(e) => setGeneral((g) => ({ ...g, slotLength: e.target.value }))}
            />
            <Button onClick={() => save("general")} disabled={saveGroup.isPending}>Save</Button>
          </Card>
        </div>
      )}

      {tab === "orders" && saved && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card title="Payment & confirmation timers">
            <Field
              label="Online payment window (min)"
              type="number"
              value={orderRules.paymentWindow}
              onChange={(e) => setOrderRules((o) => ({ ...o, paymentWindow: e.target.value }))}
            />
            <Field
              label="Customer reply window (min)"
              type="number"
              value={orderRules.replyWindow}
              onChange={(e) => setOrderRules((o) => ({ ...o, replyWindow: e.target.value }))}
            />
            <Field
              label="Rider accept window (min)"
              type="number"
              value={orderRules.riderAcceptWindow}
              onChange={(e) => setOrderRules((o) => ({ ...o, riderAcceptWindow: e.target.value }))}
            />
            <Button onClick={() => save("orderRules")} disabled={saveGroup.isPending}>Save</Button>
          </Card>

          <Card title="Cancellations & refunds">
            <Toggle label="Allow cancel while picking" checked={orderRules.cancelWhilePicking} onChange={(v) => setOrderRules((o) => ({ ...o, cancelWhilePicking: v }))} />
            <Toggle label="Allow cancel while packing" checked={orderRules.cancelWhilePacking} onChange={(v) => setOrderRules((o) => ({ ...o, cancelWhilePacking: v }))} />
            <Toggle label="Auto-refund missing items" checked={orderRules.autoRefundMissing} onChange={(v) => setOrderRules((o) => ({ ...o, autoRefundMissing: v }))} />
            <Button onClick={() => save("orderRules")} disabled={saveGroup.isPending}>Save</Button>
          </Card>
        </div>
      )}

      {tab === "security" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card title="Profile">
            <Field label="Name" value={effectiveAccount.name} onChange={(e) => setAccount((a) => ({ ...a, name: e.target.value }))} />
            <Field label="Email" value={effectiveAccount.email} onChange={(e) => setAccount((a) => ({ ...a, email: e.target.value }))} />
            <Field label="Mobile" value={effectiveAccount.mobile} onChange={(e) => setAccount((a) => ({ ...a, mobile: e.target.value }))} />
            {mobileChanged && otp.sentTo === newMobile && (
              <Field
                label={`Code sent to +91 ${newMobile}`}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp.code}
                onChange={(e) => setOtp((o) => ({ ...o, code: e.target.value }))}
              />
            )}
            <Button onClick={onSaveProfile} disabled={!profile || sendCode.isPending || saveProfile.isPending}>
              {mobileChanged && otp.sentTo !== newMobile ? "Send code to new mobile" : "Save"}
            </Button>
          </Card>

          <Card title="Password & sessions">
            <form className="space-y-4" onSubmit={onChangePassword}>
              <Field
                label="Current password"
                type="password"
                autoComplete="current-password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
              />
              <Field
                label="New password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.next}
                onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))}
              />
              <Field
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                At least 8 characters, with a letter and a number. Your other sessions are signed out.
              </p>
              <Button type="submit" disabled={updatePassword.isPending}>Update password</Button>
            </form>

            <div className="border-t border-border pt-3">
              <p className="mb-2 text-xs font-semibold text-foreground">Signed-in sessions</p>
              <p className="text-xs text-muted-foreground">This device · current session</p>
              <Button variant="outline" className="mt-3 w-full" onClick={() => signOutOthers.mutate()} disabled={signOutOthers.isPending}>
                Sign out everywhere else
              </Button>
            </div>
          </Card>
        </div>
      )}

      {tab === "notifications" && !canNotify && (
        <p className="text-sm text-muted-foreground">Email notifications are for admins and super admins.</p>
      )}

      {tab === "notifications" && canNotify && !preferences && (
        <p className="text-sm text-muted-foreground">{preferencesLoading ? "Loading settings…" : "Unable to load the settings."}</p>
      )}

      {tab === "notifications" && canNotify && preferences && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card title="Email me when">
            {!preferences.hasEmail && (
              <p className="text-xs text-muted-foreground">
                <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setTab("security")}>
                  Add an email to your profile
                </button>{" "}
                to get these
              </p>
            )}
            <Toggle
              label="A warehouse pauses or enters maintenance"
              checked={notifications.warehousePauses}
              onChange={(v) => setNotifications((n) => ({ ...n, warehousePauses: v }))}
            />
            <Toggle
              label="A delivery partner applies"
              checked={notifications.partnerApplies}
              onChange={(v) => setNotifications((n) => ({ ...n, partnerApplies: v }))}
            />
            <Toggle
              label="Failed payments exceed 5/hour"
              checked={notifications.failedPayments}
              onChange={(v) => setNotifications((n) => ({ ...n, failedPayments: v }))}
            />
            <Toggle
              label="Daily sales summary at 10 PM"
              checked={notifications.dailySummary}
              onChange={(v) => setNotifications((n) => ({ ...n, dailySummary: v }))}
            />
            <Button onClick={onSaveNotifications} disabled={savePreferences.isPending}>Save</Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Settings;
