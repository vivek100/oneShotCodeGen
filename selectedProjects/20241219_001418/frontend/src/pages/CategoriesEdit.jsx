import React from "react";
import { Edit, SimpleForm, TextInput, SelectInput, useGetList } from "react-admin";

const CategoriesEdit = () => {
  
  
  
  
  

  return (
    <Edit>
      <SimpleForm>
        
        
        <TextInput source="name" type="text" />
        
        
        
        <TextInput source="description" type="text" />
        
        
      </SimpleForm>
    </Edit>
  );
};

export default CategoriesEdit;