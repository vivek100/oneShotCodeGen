import React from "react";
import { Create, SimpleForm, TextInput, SelectInput, useGetList } from "react-admin";

const TaxDeductionsCreate = () => {
  
  
  
  
  

  return (
    <Create>
      <SimpleForm>
        
        
        <TextInput source="tax_name" type="text" />
        
        
        
        <TextInput source="tax_rate" type="number" />
        
        
      </SimpleForm>
    </Create>
  );
};

export default TaxDeductionsCreate;