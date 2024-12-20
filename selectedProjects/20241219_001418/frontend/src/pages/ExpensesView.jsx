import React from "react";
import { Show, SimpleShowLayout, TextField, DateField } from "react-admin";

const ExpensesView = () => (
  <Show>
    <SimpleShowLayout>
      
      
      <TextField source="amount" />
      
      
      
      <TextField source="category_id" />
      
      
    </SimpleShowLayout>
  </Show>
);

export default ExpensesView;