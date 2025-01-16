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
          primaryText="Payroll Dashboard"
          leftIcon={<DashboardIcon />}
          selected={location.pathname === "/"}
        />
        
      
        
        <MenuItemLink
          to="/employees"
          primaryText="Employees"
          leftIcon={<BookIcon />}
          selected={location.pathname.startsWith("/employees")}
        />
        
      
        
        <MenuItemLink
          to="/payroll_records"
          primaryText="Payroll Records"
          leftIcon={<BookIcon />}
          selected={location.pathname.startsWith("/payroll_records")}
        />
        
      
        
        <MenuItemLink
          to="/tax_deductions"
          primaryText="Tax Deductions"
          leftIcon={<BookIcon />}
          selected={location.pathname.startsWith("/tax_deductions")}
        />
        
      
        
        <MenuItemLink
          to="/payroll_reports"
          primaryText="Payroll Reports"
          leftIcon={<BookIcon />}
          selected={location.pathname.startsWith("/payroll_reports")}
        />
        
      
        
        <MenuItemLink
          to="/Payroll Reports Generation"
          primaryText="Payroll Reports Generation"
          leftIcon={<CategoryIcon />}
          selected={location.pathname.startsWith("/Payroll Reports Generation")}
        />
        
      
    </Menu>
  );
};

const CustomLayout = (props) => <Layout {...props} menu={CustomMenu} />;

export default CustomLayout;