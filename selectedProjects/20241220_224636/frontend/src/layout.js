import * as React from "react";
import { Layout, Menu, MenuItemLink } from "react-admin";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BookIcon from "@mui/icons-material/Book";
import CategoryIcon from "@mui/icons-material/Category";
import MoneyIcon from "@mui/icons-material/AttachMoney";
import MailLockIcon from "@mui/icons-material/MailLock";
import DrawIcon from "@mui/icons-material/Draw";
import { useLocation } from "react-router-dom";
import PostAddIcon from "@mui/icons-material/PostAdd";

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
        <MenuItemLink
          to="/docu_envelopes"
          primaryText="DocuSign Envelopes"
          leftIcon={<MailLockIcon />}
          selected={location.pathname.startsWith("/docu_envelopes")}
        />
        <MenuItemLink
          to="/docu_signers"
          primaryText="To be signed"
          leftIcon={<DrawIcon />}
          selected={location.pathname.startsWith("/docu_signers")}
        />
        <MenuItemLink
          to="/docu_templates"
          primaryText="DocuSign Templates"
          leftIcon={<PostAddIcon />}
          selected={location.pathname.startsWith("/docu_templates")}
        />
        
      
    </Menu>
  );
};

const CustomLayout = (props) => <Layout {...props} menu={CustomMenu} />;

export default CustomLayout;