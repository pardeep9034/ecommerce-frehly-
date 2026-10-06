import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getProfile } from "@/apis/authApi";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/dashboard/PageHeader";

// config-service now serves GET /config and PATCH /config/:group (general,
// orderRules; see BACKEND_REQUIREMENTS.md #13) but this page isn't wired to it
// yet — every field here is local state only; Save buttons show a "not wired
// up" toast, same convention as the Orders page's Export button.
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

const notWiredUp = () => toast("This isn't wired up yet");

const Settings = () => {
  const [tab, setTab] = useState("general");
  const user = useSelector((state) => state.auth.user);

  const [general, setGeneral] = useState({
    businessName: "Freshly",
    supportPhone: "+91 98000 00000",
    supportEmail: "support@freshly.example",
    gstin: "",
    cod: true,
    showOutOfStock: true,
    slotLength: 2,
  });

  const [orderRules, setOrderRules] = useState({
    paymentWindow: 15,
    replyWindow: 15,
    riderAcceptWindow: 5,
    cancelWhilePicking: true,
    cancelWhilePacking: false,
    autoRefundMissing: true,
  });

  const [notifications, setNotifications] = useState({
    warehousePauses: true,
    partnerApplies: true,
    failedPayments: true,
    dailySummary: false,
  });

  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });

  const { data: profile } = useQuery({ queryKey: ["auth-profile"], queryFn: getProfile });
  const profileName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || user?.name || "";
  const [account, setAccount] = useState({ name: "", email: "", mobile: "" });

  const effectiveAccount = {
    name: account.name || profileName,
    email: account.email || profile?.email || user?.email || "",
    mobile: account.mobile || profile?.phone || user?.phone || "",
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

      {tab === "general" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card title="Business">
            <Field label="Business name" value={general.businessName} onChange={(e) => setGeneral((g) => ({ ...g, businessName: e.target.value }))} />
            <Field label="Support phone" value={general.supportPhone} onChange={(e) => setGeneral((g) => ({ ...g, supportPhone: e.target.value }))} />
            <Field label="Support email" value={general.supportEmail} onChange={(e) => setGeneral((g) => ({ ...g, supportEmail: e.target.value }))} />
            <Field label="GSTIN" placeholder="Optional" value={general.gstin} onChange={(e) => setGeneral((g) => ({ ...g, gstin: e.target.value }))} />
            <Button onClick={notWiredUp}>Save</Button>
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
            <Button onClick={notWiredUp}>Save</Button>
          </Card>
        </div>
      )}

      {tab === "orders" && (
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
            <Button onClick={notWiredUp}>Save</Button>
          </Card>

          <Card title="Cancellations & refunds">
            <Toggle label="Allow cancel while picking" checked={orderRules.cancelWhilePicking} onChange={(v) => setOrderRules((o) => ({ ...o, cancelWhilePicking: v }))} />
            <Toggle label="Allow cancel while packing" checked={orderRules.cancelWhilePacking} onChange={(v) => setOrderRules((o) => ({ ...o, cancelWhilePacking: v }))} />
            <Toggle label="Auto-refund missing items" checked={orderRules.autoRefundMissing} onChange={(v) => setOrderRules((o) => ({ ...o, autoRefundMissing: v }))} />
            <Button onClick={notWiredUp}>Save</Button>
          </Card>
        </div>
      )}

      {tab === "security" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card title="Profile">
            <Field label="Name" value={effectiveAccount.name} onChange={(e) => setAccount((a) => ({ ...a, name: e.target.value }))} />
            <Field label="Email" value={effectiveAccount.email} onChange={(e) => setAccount((a) => ({ ...a, email: e.target.value }))} />
            <Field label="Mobile" value={effectiveAccount.mobile} onChange={(e) => setAccount((a) => ({ ...a, mobile: e.target.value }))} />
            <Button onClick={notWiredUp}>Save</Button>
          </Card>

          <Card title="Password & sessions">
            <Field
              label="Current password"
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
            />
            <Field
              label="New password"
              type="password"
              value={passwordForm.next}
              onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))}
            />
            <Field
              label="Confirm new password"
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
            />
            <Button onClick={notWiredUp}>Update password</Button>

            <div className="border-t border-border pt-3">
              <p className="mb-2 text-xs font-semibold text-foreground">Signed-in sessions</p>
              <p className="text-xs text-muted-foreground">This device · current session</p>
              <Button variant="outline" className="mt-3 w-full" onClick={notWiredUp}>
                Sign out everywhere else
              </Button>
            </div>
          </Card>
        </div>
      )}

      {tab === "notifications" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card title="Email me when">
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
            <Button onClick={notWiredUp}>Save</Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Settings;
