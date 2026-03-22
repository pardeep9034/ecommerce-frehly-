import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const OtpModal = ({
  open,
  onClose,
  title = "Verify OTP",
  children,
  disableClose = false
}) => {

  const handleClose = (event, reason) => {

  if (disableClose) return;

  if (reason === "backdropClick") return;

  onClose();
};

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 3,
          padding: 1
        }
      }}
    >
      <DialogTitle
        sx={{
            display: "flex",
            justifyContent: "right",
            fontWeight: 600
        }}
      >
     

        {!disableClose &&(
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mt: 1 }}>
          {children}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default OtpModal;