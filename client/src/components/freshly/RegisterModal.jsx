import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Box,
  Button,
  IconButton,
  Stack
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useMutation } from "@tanstack/react-query";
import { registerUser } from "@/apis/authApi";

const RegisterModal = ({ open, onClose, phone, onSuccess }) => {

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: ""
  });

  const [errors, setErrors] = useState({});

  const { mutate, isPending } = useMutation({
    mutationFn: (payload) => registerUser(payload),
    onSuccess: (data) => {
      onSuccess(data);
    },
    onError: (err) => {
      console.error("Register failed", err);
    }
  });

  const validate = () => {
    let newErrors = {};

    if (!form.first_name.trim()) newErrors.first_name = "First name required";
    if (!form.last_name.trim()) newErrors.last_name = "Last name required";
    if (!form.email.trim()) newErrors.email = "Email required";
    if (!form.password || form.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {

    if (!validate()) return;

    mutate({
      phone,
      ...form
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Complete Registration
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box mt={2}>
          <Stack spacing={2}>

            <TextField
              label="Phone"
              value={phone}
              disabled
              fullWidth
            />

            <TextField
              label="First Name"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              error={!!errors.first_name}
              helperText={errors.first_name}
              fullWidth
            />

            <TextField
              label="Last Name"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              error={!!errors.last_name}
              helperText={errors.last_name}
              fullWidth
            />

            <TextField
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              fullWidth
            />

            <TextField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              fullWidth
            />

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isPending}
              fullWidth
            >
              {isPending ? "Registering..." : "Register"}
            </Button>

          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModal;