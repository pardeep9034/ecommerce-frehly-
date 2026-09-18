import { Outlet } from "react-router-dom";
import Navbar from "@/components/freshly/Navbar";
import Footer from "@/components/freshly/Footer";

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