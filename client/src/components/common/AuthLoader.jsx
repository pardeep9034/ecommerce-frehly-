import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser, logout } from "@/redux/authSlice";
import { getProfile } from "@/apis/authApi";

const AuthLoader = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) return;

      try {
        const res = await getProfile();
        dispatch(setUser(res)); // 🔥 restore user
        console.log("user",res)

      } catch (err) {
        console.log("Auth failed", err);
        dispatch(logout()); // 🔥 cleanup invalid token
      }
    };

    initAuth();
  }, []);

  return children;
};

export default AuthLoader;