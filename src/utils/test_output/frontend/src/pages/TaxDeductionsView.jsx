import React from "react";
import { Show, SimpleShowLayout, TextField, DateField } from "react-admin";

const TaxDeductionsView = () => (
  <Show>
    <SimpleShowLayout>
      
      
      <TextField source="tax_name" />
      
      
      
      <TextField source="tax_rate" />
      
      
    </SimpleShowLayout>
  </Show>
);

export default TaxDeductionsView;