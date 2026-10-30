import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { changePassword } from "@/apis/authApi";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import UnderlineTabs from "@/components/dashboard/UnderlineTabs";
import WarehouseLocationForm from "@/components/dashboard/WarehouseLocationForm";
import WarehouseSettingsForm from "@/components/dashboard/WarehouseSettingsForm";
import { useWarehouseDetail } from "@/hooks/use-warehouse";
import useDeliveryZone from "@/hooks/use-deliveryZone";
import { currentStaff, warehouseAccess } from "@/lib/warehouseAccess";
import { getStoreDesignation } from "../../lib/storeRole";
import StorePage, { BTN, CARD } from "../../components/store/StorePage";
import LogoutDialog from "../../components/store/LogoutDialog";

const TABS = [
  { value: "account", label: "My account" },
  { value: "store", label: "Store status & hours" },
  { value: "location", label: "Location" },
];

const PASSWORD_FIELDS = [
  { key: "current", label: "Current password", autoComplete: "current-password" },
  { key: "next", label: "New password", autoComplete: "new-password" },
  { key: "confirm", label: "Confirm new password", autoComplete: "new-password" },
];

// A validation reply names the field; other errors carry a message.
const errorText = (error, fallback) =>
  error?.response?.data?.errors?.[0]?.message || error?.response?.data?.message || fallback;

// My account (password + logout) and the store's own settings. The store tabs are the warehouse detail page's
// Settings and Location forms: the store manager changes status, hours, pack-by and address here; store staff
// see them read only; the zone stays with the super admin (lib/warehouseAccess.js). Auto-assign, racks and the
// profile toggles (on shift, sounds, language) still have no backing fields — see STORE_OPERATIONS_MODULE.md, "Deferred".
const StoreSettings = () => {
  const { staff } = useOutletContext();
  const designation = staff?.designation || getStoreDesignation();
  const [tab, setTab] = useState("account");
  const { ownWarehouseId } = currentStaff();
  const access = warehouseAccess(ownWarehouseId);
  const { warehouse, isLoading: isWarehouseLoading } = useWarehouseDetail(ownWarehouseId);
  const { deliveryZonesData } = useDeliveryZone(1, 100);
  const zones = deliveryZonesData?.data?.deliveryZones ?? [];

  const initials = (staff?.name || "S")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // PUT /auth/password (same as the admin Settings page): replaces the password the
  // super admin issued, keeps this device signed in and ends the other sessions.
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const updatePassword = useMutation({
    mutationFn: () => changePassword(passwordForm.current, passwordForm.next),
    onSuccess: () => {
      setPasswordForm({ current: "", next: "", confirm: "" });
      toast.success("Password changed");
    },
    onError: (error) => toast.error(errorText(error, "Unable to change the password")),
  });
  const onChangePassword = (event) => {
    event.preventDefault();
    if (!passwordForm.current || !passwordForm.next) return toast.error("Enter your current and new password");
    if (passwordForm.next !== passwordForm.confirm) return toast.error("The new passwords don't match");
    updatePassword.mutate();
  };

  return (
    <StorePage title="Settings" subtitle={[designation, staff?.warehouse_name].filter(Boolean).join(" · ")}>
      <UnderlineTabs label="Settings sections" tabs={TABS} value={tab} onChange={setTab} />

      {tab !== "account" && (
        <div className="flex max-w-3xl flex-col gap-4">
          {!ownWarehouseId ? (
            <p className="text-sm text-muted-foreground">No store is assigned to your account yet. Ask the super admin to assign you to one.</p>
          ) : isWarehouseLoading ? (
            <p className="text-sm text-muted-foreground">Loading store…</p>
          ) : !warehouse ? (
            <p className="text-sm text-muted-foreground">Couldn't load your store.</p>
          ) : tab === "store" ? (
            <WarehouseSettingsForm warehouse={warehouse} access={access} />
          ) : (
            <WarehouseLocationForm warehouse={warehouse} access={access} zones={zones} idPrefix="store" />
          )}
        </div>
      )}

      {tab === "account" && (
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[360px_minmax(0,480px)] lg:items-start lg:gap-5">
        <div className="flex flex-col gap-3">
          <section className="flex items-center gap-3.5 rounded-2xl bg-primary p-5 text-white lg:flex-col lg:text-center">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#FBBD23] font-display text-xl font-bold text-[#0F4A26] lg:h-20 lg:w-20 lg:text-2xl">
              {initials}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="truncate text-[19px]">{staff?.name || "Loading…"}</h2>
              <span className="text-[13px] text-[#D6EADD]">{[designation, staff?.warehouse_name].filter(Boolean).join(" · ")}</span>
              {staff?.phone && <span className="text-[13px] text-[#D6EADD]">{staff.phone}</span>}
            </div>
          </section>
          <LogoutDialog>
            <button type="button" className={`${BTN.secondary} text-[#B42318]`}>
              <LogOut className="h-[18px] w-[18px]" /> End shift &amp; log out
            </button>
          </LogoutDialog>
        </div>

        <form onSubmit={onChangePassword} className={`${CARD} flex flex-col gap-4 p-5`}>
          <h2 className="text-lg">Change password</h2>
          {PASSWORD_FIELDS.map(({ key, label, autoComplete }) => (
            <label key={key} className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">{label}</span>
              <Input
                type="password"
                autoComplete={autoComplete}
                value={passwordForm[key]}
                onChange={(e) => setPasswordForm((p) => ({ ...p, [key]: e.target.value }))}
                className="h-12 rounded-xl lg:h-11"
              />
            </label>
          ))}
          <p className="text-xs text-muted-foreground">
            At least 8 characters, with a letter and a number. Your other sessions are signed out.
          </p>
          <button type="submit" disabled={updatePassword.isPending} className={BTN.primary}>
            {updatePassword.isPending ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
      )}
    </StorePage>
  );
};

export default StoreSettings;
