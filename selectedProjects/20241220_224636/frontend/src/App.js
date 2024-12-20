import React from "react";
import { Admin, Resource, CustomRoutes, Authenticated } from "react-admin";
import { Route } from "react-router-dom";
import { dataProvider } from "./providers/dataProvider";
import { authProvider } from "./providers/authProvider";
import Dashboard from "./pages/Dashboard";
import CustomLayout from "./layout";

import ManageJobCategories from "./pages/ManageJobCategories";


import JobApplicationsList from "./pages/JobApplicationsList";
import JobApplicationsView from "./pages/JobApplicationsView";
import JobApplicationsEdit from "./pages/JobApplicationsEdit";
import JobApplicationsCreate from "./pages/JobApplicationsCreate";


const App = () => (
  <Admin 
    dashboard={Dashboard}
    dataProvider={dataProvider}
    authProvider={authProvider}
    layout={CustomLayout}
  >
    
    <Resource
      name="job_applications"
      list={ JobApplicationsList }
      show={ JobApplicationsView }
      edit={ JobApplicationsEdit }
      create={ JobApplicationsCreate }
    />
    <CustomRoutes>
      <Route path="/managejobcategories" element={<Authenticated><ManageJobCategories /></Authenticated>} />
    </CustomRoutes></Admin>
);

export default App;