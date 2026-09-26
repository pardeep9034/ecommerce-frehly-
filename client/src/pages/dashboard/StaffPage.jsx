import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ShieldCheck, UserCog, HardHat, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StaffTable from "@/components/dashboard/StaffTable";
import TableSkeleton from "@/components/dashboard/TableSkeleton";
import Pagination from "@/components/common/Pagination";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useStaff from "@/hooks/use-staff";
import { roleLabel } from "@/lib/staffRole";

const ROLE_TABS = [
  { value: "ALL", label: "All" },
  { value: "SUPER_ADMIN", label: roleLabel("SUPER_ADMIN") },
  { value: "ADMIN", label: roleLabel("ADMIN") },
  { value: "OPS_STAFF", label: roleLabel("OPS_STAFF") },
];

const StaffPage = () => {
  const navigate = useNavigate();
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filters = roleFilter === "ALL" ? {} : { role: roleFilter };
  const { staff, pagination, summary, isLoading, setStatusMutation, resetPasswordMutation, resendInviteMutation } =
    useStaff(currentPage, 10, filters);

  const filteredStaff = staff.filter((user) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      [user.first_name, user.last_name].filter(Boolean).join(" ").toLowerCase().includes(term) ||
      user.phone?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term)
    );
  });

  const handleToggleStatus = (user) => {
    setStatusMutation.mutate({ id: user.id, isActive: !user.is_active });
  };

  const handleResetPassword = (user) => {
    resetPasswordMutation.mutate({ id: user.id, data: { password_method: "set" } });
  };

  const handleResendInvite = (user) => {
    resendInviteMutation.mutate(user.id);
  };

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Staff & Admins"
        description="Manage admins and operations staff across your warehouses."
        action={
          <button
            type="button"
            onClick={() => navigate("/dashboard/staff/new")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-card">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Super admins</p>
            <p className="text-xl font-semibold text-foreground">{summary.super_admin ?? 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-card">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <UserCog className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Admins</p>
            <p className="text-xl font-semibold text-foreground">{summary.admin ?? 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-card">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <HardHat className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Ops staff</p>
            <p className="text-xl font-semibold text-foreground">{summary.ops_staff ?? 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-card">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Need attention</p>
            <p className="text-xl font-semibold text-foreground">{summary.locked ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <Tabs value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setCurrentPage(1); }}>
          <TabsList>
            {ROLE_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name or phone..."
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : (
        <StaffTable
          staff={filteredStaff}
          onEdit={(user) => navigate(`/dashboard/staff/new?edit=${user.id}`)}
          onResetPassword={handleResetPassword}
          onResendInvite={handleResendInvite}
          onToggleStatus={handleToggleStatus}
        />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={pagination?.totalPages ?? 0}
        totalItems={pagination?.totalItems ?? 0}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default StaffPage;
