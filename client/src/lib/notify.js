import { toast } from "@/components/ui/sonner";

export const notify = {
  success: (message, options) => toast.success(message, options),
  error: (message, options) => toast.error(message, options),
  info: (message, options) => toast.info(message, options),
  warning: (message, options) => toast.warning(message, options),
  promise: (promise, messages) => toast.promise(promise, messages),
  // For buttons whose backend doesn't exist yet (see BACKEND_REQUIREMENTS.md).
  notWired: (what) => toast(`${what} isn't wired up yet`),
  apiError: (error, fallback = "Something went wrong") =>
    toast.error(error?.response?.data?.message || fallback),
};
