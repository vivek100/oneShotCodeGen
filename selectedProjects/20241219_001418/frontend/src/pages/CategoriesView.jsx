import React from "react";
import { Show, SimpleShowLayout, TextField, DateField } from "react-admin";

const CategoriesView = () => (
  <Show>
    <SimpleShowLayout>
      
      
      <TextField source="name" />
      
      
      
      <TextField source="description" />
      
      
    </SimpleShowLayout>
  </Show>
);

export default CategoriesView;