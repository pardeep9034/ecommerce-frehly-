import { useDispatch } from "react-redux";
import { LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { logout } from "../../redux/authSlice";
import { BTN } from "./StorePage";

// "End shift" confirm: a bottom sheet on phones, a centred dialog from sm up.
const LogoutDialog = ({ children }) => {
  const dispatch = useDispatch();

  // Full reload, not navigate: it also drops the React Query cache (profile and store
  // name are cached with staleTime Infinity), so the next login starts clean.
  const endShift = () => {
    dispatch(logout());
    window.location.replace("/store/login");
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="bottom-0 top-auto translate-y-0 gap-4 rounded-t-3xl border-0 bg-card px-5 pb-6 pt-5 data-[state=closed]:slide-out-to-top-[100%] data-[state=open]:slide-in-from-top-[100%] sm:bottom-auto sm:top-[50%] sm:max-w-md sm:translate-y-[-50%] sm:rounded-2xl sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-top-[48%]">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="text-xl font-bold">End shift and log out?</AlertDialogTitle>
          <AlertDialogDescription className="leading-relaxed">
            You'll need your mobile number and password to sign back in on this device.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:space-x-0">
          <AlertDialogCancel className={`${BTN.secondary} mt-0`}>Stay logged in</AlertDialogCancel>
          <button type="button" onClick={endShift} className={BTN.danger}>
            <LogOut className="h-5 w-5" />
            End shift &amp; log out
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LogoutDialog;
