import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

const PlaceholderPage = () => {
  const location = useLocation();
  const slug = location.pathname.split("/").filter(Boolean).at(-1) || "page";
  const pageName = `${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-24">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Construction className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mb-2 font-display text-2xl font-bold text-foreground">{pageName}</h2>
      <p className="text-sm text-muted-foreground">This page is under construction.</p>
    </div>
  );
};

export default PlaceholderPage;
