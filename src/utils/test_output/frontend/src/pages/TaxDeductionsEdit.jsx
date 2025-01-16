import React from "react";
import { Edit, SimpleForm, TextInput, SelectInput, useGetList } from "react-admin";

const TaxDeductionsEdit = () => {
  
  
  
  
  

  return (
    <Edit>
      <SimpleForm>
        
        
        <TextInput source="tax_name" type="text" />
        
        
        
        <TextInput source="tax_rate" type="number" />
        
        
      </SimpleForm>
    </Edit>
  );
};

export default TaxDeductionsEdit;