import { loginWithPassword, logout } from "@/apis/authApi";
import partnerApplicationApi from "@/apis/partnerApplicationApi";
import { clearToken, getTokenRole, setToken } from "@/lib/tokenStorage";

// Approved partners go to the phone home; everyone else to their application. No
// application at all means the partner was created by staff (nobody else gets a partner account without applying).
const HOME = "/partner/home";
const destination = async () => {
  try {
    const { status } = await partnerApplicationApi.fetchMine();
    return status === "APPROVED" ? HOME : "/partner/apply/status";
  } catch (error) {
    return error.response?.status === 404 ? HOME : "/partner/apply/status";
  }
};

// Staff added this number and the person has not signed up yet: the server says "Finish sign-up first" (401).
export const needsSignup = (error) => error?.response?.status === 401 && /finish sign-up/i.test(error.response.data?.message ?? "");

// Resolves to the path to open, or null when the number is not a delivery partner (nothing is stored then).
// A customer or staff number signs in fine on the server; it just has no place in the partner app.
export const signInPartner = async ({ phone, password, remember = true }) => {
  const response = await loginWithPassword({ identifier: phone, password, rememberMe: remember });
  const token = response.data.accessToken;
  if (getTokenRole(token) !== "DELIVERY_PARTNER") return null;
  setToken(token, remember);
  return destination();
};

// Best effort on the server; the local token goes either way, or the route guard would still let this browser in.
export const signOutPartner = async () => {
  await logout().catch(() => {});
  clearToken();
};
