import React, { useState } from "react";
import { Modal as MuiModal, Box, Typography } from "@mui/material";

const Modal = ({ name, modal, content }) => {
  const [open, setOpen] = useState(false);

  const handleClose = () => setOpen(false);
  const handleOpen = () => setOpen(true);

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
  };

  return (
    <MuiModal
      open={open}
      onClose={handleClose}
      aria-labelledby={`modal-${name}`}
    >
      <Box sx={style}>
        <Typography variant="h6" component="h2">
          {name}
        </Typography>
        {content.map((Component, index) => (
          <Component key={index} />
        ))}
      </Box>
    </MuiModal>
  );
};

export default Modal;