import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "@/apis/authApi";

const EnterNewPasswordModal = ({ open, onClose }) => {

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const resetToken = localStorage.getItem("resetToken");

  const { mutate, isPending } = useMutation({
    mutationFn: (data) =>
      resetPassword({
        resetToken,
        newPassword: data.password,
      }),

    onSuccess: () => {
      onClose();
    },

    onError: (err) => {
      setError(err?.response?.data?.message || "Password reset failed");
    },
  });

  const handleSubmit = () => {

    setError("");

    if (!password || !confirmPassword) {
      setError("All fields are required");
    }
    else if (password.length < 6) {
      setError("Password must be at least 6 characters");
    }
    else if (password !== confirmPassword) {
      setError("Passwords do not match");
    }
    else {
      mutate({ password });
    }

  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl">

        {/* HEADER */}
        <div className="px-6 py-5 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Reset Your Password
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter a new secure password for your account
          </p>
        </div>

        {/* BODY */}
        <div className="px-6 py-6 space-y-5">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>

            <input
              type="password"
              placeholder="Enter new password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-700 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="Confirm your password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-700 focus:outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-5 py-2 rounded-md bg-green-700 text-white hover:bg-green-600 disabled:opacity-60"
          >
            {isPending ? "Updating..." : "Update Password"}
          </button>

        </div>

      </div>
    </div>
  );
};

export default EnterNewPasswordModal;