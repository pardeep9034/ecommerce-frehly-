import { loginWithPassword, logout } from "@/apis/authApi";
import partnerApplicationApi from "@/apis/partnerApplicationApi";
import { clearToken, getTokenRole, setToken } from "@/lib/tokenStorage";

// Approved partners go to `home` (phone app or desktop workspace); everyone else to their application. No
// application at all means the partner was created by staff (nobody else gets a partner account without applying).
const destination = async (home) => {
  try {
    const { status } = await partnerApplicationApi.fetchMine();
    return status === "APPROVED" ? home : "/partner/apply/status";
  } catch (error) {
    return error.response?.status === 404 ? home : "/partner/apply/status";
  }
};

// Resolves to the path to open, or null when the number is not a delivery partner (nothing is stored then).
// A customer or staff number signs in fine on the server; it just has no place in the partner app.
export const signInPartner = async ({ phone, password, remember = true, home }) => {
  const response = await loginWithPassword({ identifier: phone, password, rememberMe: remember });
  const token = response.data.accessToken;
  if (getTokenRole(token) !== "DELIVERY_PARTNER") return null;
  setToken(token, remember);
  return destination(home);
};

// Best effort on the server; the local token goes either way, or the route guard would still let this browser in.
export const signOutPartner = async () => {
  await logout().catch(() => {});
  clearToken();
};
