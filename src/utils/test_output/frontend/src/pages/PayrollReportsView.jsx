import React from "react";
import { Show, SimpleShowLayout, TextField, DateField } from "react-admin";

const PayrollReportsView = () => (
  <Show>
    <SimpleShowLayout>
      
      
      <TextField source="report_type" />
      
      
      
      <TextField source="generated_on" />
      
      
      
      <TextField source="details" />
      
      
    </SimpleShowLayout>
  </Show>
);

export default PayrollReportsView;