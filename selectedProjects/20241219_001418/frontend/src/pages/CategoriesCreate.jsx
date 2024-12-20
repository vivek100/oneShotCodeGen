import React from "react";
import { Create, SimpleForm, TextInput, SelectInput, useGetList } from "react-admin";

const CategoriesCreate = () => {
  
  
  
  
  

  return (
    <Create>
      <SimpleForm>
        
        
        <TextInput source="name" type="text" />
        
        
        
        <TextInput source="description" type="text" />
        
        
      </SimpleForm>
    </Create>
  );
};

export default CategoriesCreate;