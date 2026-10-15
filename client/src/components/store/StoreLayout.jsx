import { Outlet } from "react-router-dom";
import StoreSidebar from "./StoreSidebar";
import { useStoreMe } from "../../hooks/use-store";

const StoreLayout = () => {
  const { staff } = useStoreMe();
  return (
    <div className="flex min-h-screen bg-muted">
      <StoreSidebar staff={staff} />
      <main className="min-w-0 flex-1 p-6 lg:p-8">
        <Outlet context={{ staff }} />
      </main>
    </div>
  );
};

export default StoreLayout;
