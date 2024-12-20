import * as React from "react";
import { Layout, Menu, MenuItemLink } from "react-admin";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BookIcon from "@mui/icons-material/Book";
import CategoryIcon from "@mui/icons-material/Category";
import MoneyIcon from "@mui/icons-material/AttachMoney";
import { useLocation } from "react-router-dom";

const CustomMenu = (props) => {
  const location = useLocation();

  return (
    <Menu {...props}>
      
        
        <MenuItemLink
          to="/"
          primaryText="Dashboard"
          leftIcon={<DashboardIcon />}
          selected={location.pathname === "/"}
        />
        
      
        
        <MenuItemLink
          to="/job_applications"
          primaryText="Job Applications"
          leftIcon={<BookIcon />}
          selected={location.pathname.startsWith("/job_applications")}
        />
        
      
        
        <MenuItemLink
          to="/managejobcategories"
          primaryText="Manage Job Categories"
          leftIcon={<CategoryIcon />}
          selected={location.pathname.startsWith("/managejobcategories")}
        />
        
      
    </Menu>
  );
};

const CustomLayout = (props) => <Layout {...props} menu={CustomMenu} />;

export default CustomLayout;