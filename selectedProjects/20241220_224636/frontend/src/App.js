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

import TemplatesList from "./pages/TemplatesList";
import TemplatesCreate from "./pages/TemplatesCreate";
import TemplatesShow from "./pages/TemplatesShow";

import EnvelopesList from "./pages/EnvelopesList";
import EnvelopesCreate from "./pages/EnvelopesCreate";
import EnvelopesShow from "./pages/EnvelopesShow";

import SignersList from "./pages/SignersList";

const App = () => (
  <Admin 
    dashboard={Dashboard}
    dataProvider={dataProvider}
    authProvider={authProvider}
    layout={CustomLayout}
    basename=""
    requireAuth
  >
    
    <Resource
      name="job_applications"
      list={ JobApplicationsList }
      show={ JobApplicationsView }
      edit={ JobApplicationsEdit }
      create={ JobApplicationsCreate }
    />
    <Resource
      name="docu_templates"
      list={TemplatesList}
      create={TemplatesCreate}
      show={TemplatesShow}
    />
    <Resource
    name="docu_envelopes"
    list={EnvelopesList}
    create={EnvelopesCreate}
    show={EnvelopesShow}
    />
    <Resource name="docu_signers" list={SignersList} />
    <CustomRoutes>
      <Route path="/managejobcategories" element={<Authenticated><ManageJobCategories /></Authenticated>} />
    </CustomRoutes></Admin>
);

export default App;