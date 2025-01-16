import React from "react";
import { Create, SimpleForm, TextInput, SelectInput, useGetList } from "react-admin";

const EmployeesCreate = () => {
  
  
  
  
  
  
  
  
  

  return (
    <Create>
      <SimpleForm>
        
        
        <TextInput source="email" type="text" />
        
        
        
        <TextInput source="full_name" type="text" />
        
        
        
        <TextInput source="salary" type="number" />
        
        
        
        <TextInput source="tax_info" type="text" />
        
        
      </SimpleForm>
    </Create>
  );
};

export default EmployeesCreate;