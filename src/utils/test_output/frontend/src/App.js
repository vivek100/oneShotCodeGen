import React from "react";
import { Admin, Resource, CustomRoutes, Authenticated } from "react-admin";
import { Route } from "react-router-dom";
import { dataProvider } from "./providers/dataProvider";
import { authProvider } from "./providers/authProvider";
import Dashboard from "./pages/Dashboard";
import CustomLayout from "./layout";

import PayrollReportsGeneration from "./pages/PayrollReportsGeneration";


import EmployeesList from "./pages/EmployeesList";
import EmployeesView from "./pages/EmployeesView";
import EmployeesEdit from "./pages/EmployeesEdit";
import EmployeesCreate from "./pages/EmployeesCreate";

import PayrollRecordsList from "./pages/PayrollRecordsList";
import PayrollRecordsView from "./pages/PayrollRecordsView";
import PayrollRecordsEdit from "./pages/PayrollRecordsEdit";
import PayrollRecordsCreate from "./pages/PayrollRecordsCreate";

import TaxDeductionsList from "./pages/TaxDeductionsList";
import TaxDeductionsView from "./pages/TaxDeductionsView";
import TaxDeductionsEdit from "./pages/TaxDeductionsEdit";
import TaxDeductionsCreate from "./pages/TaxDeductionsCreate";

import PayrollReportsList from "./pages/PayrollReportsList";
import PayrollReportsView from "./pages/PayrollReportsView";
import PayrollReportsEdit from "./pages/PayrollReportsEdit";
import PayrollReportsCreate from "./pages/PayrollReportsCreate";


const App = () => (
  <Admin 
    dashboard={Dashboard}
    dataProvider={dataProvider}
    authProvider={authProvider}
    layout={CustomLayout}
  >
    
    <Resource
      name="employees"
      list={ EmployeesList }
      show={ EmployeesView }
      edit={ EmployeesEdit }
      create={ EmployeesCreate }
    />
    
    <Resource
      name="payroll_records"
      list={ PayrollRecordsList }
      show={ PayrollRecordsView }
      edit={ PayrollRecordsEdit }
      create={ PayrollRecordsCreate }
    />
    
    <Resource
      name="tax_deductions"
      list={ TaxDeductionsList }
      show={ TaxDeductionsView }
      edit={ TaxDeductionsEdit }
      create={ TaxDeductionsCreate }
    />
    
    <Resource
      name="payroll_reports"
      list={ PayrollReportsList }
      show={ PayrollReportsView }
      edit={ PayrollReportsEdit }
      create={ PayrollReportsCreate }
    />
    <CustomRoutes>
      <Route path="/payrollreportsgeneration" element={<Authenticated><PayrollReportsGeneration /></Authenticated>} />
    </CustomRoutes></Admin>
);

export default App;