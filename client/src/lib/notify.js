import { toast } from "@/components/ui/sonner";

export const notify = {
  success: (message, options) => toast.success(message, options),
  error: (message, options) => toast.error(message, options),
  info: (message, options) => toast.info(message, options),
  warning: (message, options) => toast.warning(message, options),
  promise: (promise, messages) => toast.promise(promise, messages),
  apiError: (error, fallback = "Something went wrong") =>
    toast.error(error?.response?.data?.message || fallback),
};
