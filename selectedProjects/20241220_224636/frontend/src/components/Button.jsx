// Button.jsx
import React from "react";
import { Button as MuiButton } from "@mui/material";

const Button = ({ name, label, action, variant = "contained" }) => {
  const handleClick = () => {
    if (action.type === "nav") {
      window.location.href = action.url;
    } else if (action.type === "modal") {
      // Trigger modal with action.modal
      console.log(`Opening modal: ${action.modal}`);
    }
  };

  return (
    <MuiButton 
      variant={variant} 
      onClick={handleClick}
    >
      {label}
    </MuiButton>
  );
};

export default Button;