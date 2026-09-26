import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Copy, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import SearchableSelector from "@/components/common/SearchableSelector";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import useStaff, { useStaffDetail } from "@/hooks/use-staff";
import useWarehouse from "@/hooks/use-warehouse";
import { STAFF_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/staffRole";
import { notify } from "@/lib/notify";

const staffSchema = z
  .object({
    first_name: z.string().min(1, "Enter a first name"),
    last_name: z.string().min(1, "Enter a last name"),
    phone: z.string().min(10, "Enter a valid phone number"),
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    role: z.enum(STAFF_ROLES),
    warehouse_id: z.string().optional(),
    password_method: z.enum(["set", "link"]),
    password: z.string().optional(),
    must_change_password: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.role !== "SUPER_ADMIN" && !data.warehouse_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["warehouse_id"], message: "Select a warehouse" });
    }
    if (data.password_method === "set" && (!data.password || data.password.length < 8)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "Enter a password with at least 8 characters" });
    }
  });

const DEFAULT_VALUES = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  role: "OPS_STAFF",
  warehouse_id: "",
  password_method: "set",
  password: "",
  must_change_password: true,
};

const StaffNewPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);

  const [result, setResult] = useState(null);
  const { createMutation, updateMutation } = useStaff(0, 0);
  const { user: existingUser } = useStaffDetail(editId);
  const { warehouses } = useWarehouse(1, 100);

  const form = useForm({
    resolver: zodResolver(staffSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (existingUser) {
      form.reset({
        first_name: existingUser.first_name || "",
        last_name: existingUser.last_name || "",
        phone: existingUser.phone || "",
        email: existingUser.email || "",
        role: existingUser.role || "OPS_STAFF",
        warehouse_id: existingUser.warehouse_id ? String(existingUser.warehouse_id) : "",
        password_method: "set",
        password: "",
        must_change_password: true,
      });
    }
  }, [existingUser]);

  const role = form.watch("role");
  const passwordMethod = form.watch("password_method");

  const onSubmit = (values) => {
    if (isEditMode) {
      const { first_name, last_name, phone, email, role, warehouse_id } = values;
      updateMutation.mutate(
        { id: editId, data: { first_name, last_name, phone, email, role, warehouse_id } },
        { onSuccess: () => navigate("/dashboard/staff") }
      );
      return;
    }

    createMutation.mutate(values, {
      onSuccess: (response) => setResult(response?.data),
    });
  };

  const copyPassword = () => {
    if (!result?.temporary_password) return;
    navigator.clipboard.writeText(result.temporary_password);
    notify.success("Password copied to clipboard");
  };

  if (result) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">User created</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Share these login details securely. The password cannot be shown again once you leave this page.
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-white p-5 text-left shadow-card">
          <div>
            <p className="text-xs text-muted-foreground">Phone / Login ID</p>
            <p className="font-medium text-foreground">{result.phone}</p>
          </div>
          {result.temporary_password && (
            <div>
              <p className="text-xs text-muted-foreground">Temporary password</p>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted px-3 py-2">
                <span className="font-mono text-sm text-foreground">{result.temporary_password}</span>
                <button type="button" onClick={copyPassword} className="text-muted-foreground hover:text-foreground">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          {result.invite_sent && <p className="text-sm text-muted-foreground">A login link was sent by SMS.</p>}
        </div>

        <div className="flex justify-center gap-3">
          <Button type="button" variant="outline" onClick={() => { setResult(null); form.reset(DEFAULT_VALUES); }}>
            Add another
          </Button>
          <Button type="button" onClick={() => navigate("/dashboard/staff")}>
            Go to staff list
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title={isEditMode ? "Edit User" : "Add User"}
        description={isEditMode ? "Update this user's details and role." : "Create a new admin or ops staff account."}
        backTo="/dashboard/staff"
        backLabel="Back to Staff & Admins"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4 rounded-xl border border-border bg-white p-6 shadow-card">
                <h2 className="font-display text-base font-semibold text-foreground">Personal details</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} disabled={isEditMode} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-border bg-white p-6 shadow-card">
                <h2 className="font-display text-base font-semibold text-foreground">Role</h2>
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          {STAFF_ROLES.map((roleValue) => (
                            <label
                              key={roleValue}
                              className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-sm transition-colors ${
                                field.value === roleValue ? "border-primary bg-primary/5" : "border-border"
                              }`}
                            >
                              <span className="flex items-center gap-2 font-medium text-foreground">
                                <RadioGroupItem value={roleValue} />
                                {ROLE_LABELS[roleValue]}
                              </span>
                              <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[roleValue]}</span>
                            </label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {role !== "SUPER_ADMIN" && (
                  <FormField
                    control={form.control}
                    name="warehouse_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warehouse</FormLabel>
                        <FormControl>
                          <SearchableSelector
                            id={field.name}
                            ref={field.ref}
                            data={warehouses}
                            placeholder="Select a warehouse"
                            value={field.value}
                            onSelect={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {!isEditMode && (
                <div className="space-y-4 rounded-xl border border-border bg-white p-6 shadow-card">
                  <h2 className="font-display text-base font-semibold text-foreground">Login &amp; password</h2>
                  <FormField
                    control={form.control}
                    name="password_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup value={field.value} onValueChange={field.onChange} className="grid-flow-col justify-start gap-6">
                            <label className="flex items-center gap-2 text-sm text-foreground">
                              <RadioGroupItem value="set" />
                              Set password now
                            </label>
                            <label className="flex items-center gap-2 text-sm text-foreground">
                              <RadioGroupItem value="link" />
                              Send link via SMS
                            </label>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {passwordMethod === "set" && (
                    <>
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Temporary password</FormLabel>
                            <FormControl>
                              <Input type="text" placeholder="Enter a temporary password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="must_change_password"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-lg border border-border px-4 py-3">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="cursor-pointer">Require password change at first login</FormLabel>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate("/dashboard/staff")}>
                  Cancel
                </Button>
                <Button type="submit">{isEditMode ? "Save changes" : "Create user"}</Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-white p-6 shadow-card lg:col-span-1">
          <h2 className="font-display text-base font-semibold text-foreground">Access summary</h2>
          <p className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {role === "SUPER_ADMIN" && (
              <>
                <li>• Access to every warehouse</li>
                <li>• Can create and manage all users</li>
                <li>• Full settings access</li>
              </>
            )}
            {role === "ADMIN" && (
              <>
                <li>• Manages the selected warehouse</li>
                <li>• Can view and assign its team</li>
                <li>• Manages inventory and orders</li>
              </>
            )}
            {role === "OPS_STAFF" && (
              <>
                <li>• Fulfils orders at the selected warehouse</li>
                <li>• No access to settings or other warehouses</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StaffNewPage;
