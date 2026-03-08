import { Outlet } from "react-router-dom";
import Navbar from "../common/navbar";

const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </>
  );
};

export default PublicLayout;