import React from "react";
import { Create, SimpleForm, TextInput, SelectInput, useGetList } from "react-admin";

const ExpensesCreate = () => {
  
  
  
  
  

  return (
    <Create>
      <SimpleForm>
        
        
        <TextInput source="amount" type="number" />
        
        
        
        <SelectInput 
          source="category_id" 
          
          choices={[{"label_field": "name", "options": {"label_field": "name", "provider": "categories", "value_field": "id"}, "provider": "categories", "type": "dynamic", "value_field": "id"}]}
          
        />
        
        
      </SimpleForm>
    </Create>
  );
};

export default ExpensesCreate;