import React from "react";
import { Show, SimpleShowLayout, TextField, DateField } from "react-admin";

const PayrollRecordsView = () => (
  <Show>
    <SimpleShowLayout>
      
      
      <TextField source="employee_id" />
      
      
      
      <TextField source="pay_period_start" />
      
      
      
      <TextField source="pay_period_end" />
      
      
      
      <TextField source="gross_pay" />
      
      
      
      <TextField source="deductions" />
      
      
      
      <TextField source="net_pay" />
      
      
    </SimpleShowLayout>
  </Show>
);

export default PayrollRecordsView;