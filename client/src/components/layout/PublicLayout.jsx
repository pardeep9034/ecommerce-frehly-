import { Outlet } from "react-router-dom";
import Navbar from "../common/navbar";
import Footer from "../common/footer";

const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default PublicLayout;