import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { logout as logoutAction } from "../../redux/authSlice";
import { useDispatch } from "react-redux";
import { changePassword } from "@/apis/authApi";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { getStoreDesignation } from "../../lib/storeRole";

const PASSWORD_FIELDS = [
  { key: "current", label: "Current password", autoComplete: "current-password" },
  { key: "next", label: "New password", autoComplete: "new-password" },
  { key: "confirm", label: "Confirm new password", autoComplete: "new-password" },
];

// A validation reply names the field; other errors carry a message.
const errorText = (error, fallback) =>
  error?.response?.data?.errors?.[0]?.message || error?.response?.data?.message || fallback;

// Only "My profile", password + logout — the design's "Store settings" tab (hours,
// pack-by target, auto-assign, racks) has no backing fields anywhere in
// Warehouse.model.js. Rather than ship toggles that save nothing (the same
// call made for delivery-partner's online/offline toggle), it's left out —
// see STORE_OPERATIONS_MODULE.md, "Deferred".
const StoreSettings = () => {
  const { staff } = useOutletContext();
  const dispatch = useDispatch();

  const initials = (staff?.name || "S")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(logoutAction());
    window.location.replace("/store/login");
  };

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Your account</p>
      </div>

      <section className="flex max-w-sm flex-col items-center gap-2 rounded-2xl border border-border bg-white p-6 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-warning/20 text-2xl font-bold text-warning">
          {initials}
        </span>
        <h2 className="text-lg font-bold text-foreground">{staff?.name || "Loading…"}</h2>
        <p className="text-sm text-muted-foreground">
          {staff?.designation || getStoreDesignation()} · {staff?.warehouse_name || "—"}
        </p>
        <p className="text-sm text-muted-foreground">{staff?.phone}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-destructive"
        >
          End shift & log out
        </button>
      </section>

      <form
        onSubmit={onChangePassword}
        className="flex max-w-sm flex-col gap-4 rounded-2xl border border-border bg-white p-6"
      >
        <h2 className="text-lg font-bold text-foreground">Change password</h2>
        {PASSWORD_FIELDS.map(({ key, label, autoComplete }) => (
          <label key={key} className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">{label}</span>
            <Input
              type="password"
              autoComplete={autoComplete}
              value={passwordForm[key]}
              onChange={(e) => setPasswordForm((p) => ({ ...p, [key]: e.target.value }))}
            />
          </label>
        ))}
        <p className="text-xs text-muted-foreground">
          At least 8 characters, with a letter and a number. Your other sessions are signed out.
        </p>
        <button
          type="submit"
          disabled={updatePassword.isPending}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {updatePassword.isPending ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
};

export default StoreSettings;
