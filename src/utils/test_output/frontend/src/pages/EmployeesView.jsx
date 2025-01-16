import React from "react";
import { Show, SimpleShowLayout, TextField, DateField } from "react-admin";

const EmployeesView = () => (
  <Show>
    <SimpleShowLayout>
      
      
      <TextField source="email" />
      
      
      
      <TextField source="full_name" />
      
      
      
      <TextField source="salary" />
      
      
      
      <TextField source="tax_info" />
      
      
    </SimpleShowLayout>
  </Show>
);

export default EmployeesView;