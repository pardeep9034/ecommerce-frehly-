import { Outlet } from "react-router-dom";
import PartnerSidebar from "./PartnerSidebar";
import { usePartnerMe } from "../../hooks/use-partner";

const PartnerLayout = () => {
  const { partner } = usePartnerMe();

  return (
    <div className="flex min-h-screen bg-muted">
      <PartnerSidebar partner={partner} />
      <main className="min-w-0 flex-1 p-6 lg:p-8">
        <Outlet context={{ partner }} />
      </main>
    </div>
  );
};

export default PartnerLayout;
