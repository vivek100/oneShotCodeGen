import React from "react";
import { Edit, SimpleForm, TextInput, SelectInput, useGetList } from "react-admin";

const EmployeesEdit = () => {
  
  
  
  
  
  
  
  
  

  return (
    <Edit>
      <SimpleForm>
        
        
        <TextInput source="email" type="text" />
        
        
        
        <TextInput source="full_name" type="text" />
        
        
        
        <TextInput source="salary" type="number" />
        
        
        
        <TextInput source="tax_info" type="text" />
        
        
      </SimpleForm>
    </Edit>
  );
};

export default EmployeesEdit;