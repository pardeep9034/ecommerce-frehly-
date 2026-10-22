import { Outlet } from "react-router-dom";
import Navbar from "@/components/freshly/Navbar";
import Footer from "@/components/freshly/Footer";
import LocationPicker, { NotServiceableBanner } from "@/components/freshly/LocationPicker";

const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <NotServiceableBanner />
        <Outlet />
      </main>
      <Footer />
      {/* Room for the phone tab bar (Navbar) so it never covers the end of the page. */}
      <div aria-hidden="true" className="h-[calc(4rem+1px+env(safe-area-inset-bottom))] lg:hidden" />
      <LocationPicker />
    </>
  );
};

export default PublicLayout;