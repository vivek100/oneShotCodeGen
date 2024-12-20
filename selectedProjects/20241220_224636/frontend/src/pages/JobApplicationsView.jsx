import React from "react";
import { Show, SimpleShowLayout, TextField, DateField } from "react-admin";

const JobApplicationsView = () => (
  <Show>
    <SimpleShowLayout>
      
      
      <TextField source="job_title" />
      
      
      
      <TextField source="company_name" />
      
      
      
      <DateField source="application_date" />
      
      
      
      <TextField source="status" />
      
      
      
      <TextField source="category_id" />
      
      
    </SimpleShowLayout>
  </Show>
);

export default JobApplicationsView;