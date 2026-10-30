import { Outlet, useMatch } from "react-router-dom";
import StoreSidebar from "./StoreSidebar";
import { useStoreMe } from "../../hooks/use-store";

const StoreLayout = () => {
  const { staff } = useStoreMe();
  // Order detail is a full-screen task on phones: its own footer replaces the tab bar.
  const onOrder = !!useMatch("/store/orders/:orderId");
  return (
    <div className="flex min-h-screen bg-muted">
      <StoreSidebar staff={staff} hideOnPhone={onOrder} />
      <div className={`flex min-w-0 flex-1 flex-col ${onOrder ? "" : "pb-[72px] lg:pb-0"}`}>
        <Outlet context={{ staff }} />
      </div>
    </div>
  );
};

export default StoreLayout;
