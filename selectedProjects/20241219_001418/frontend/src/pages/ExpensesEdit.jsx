import React from "react";
import { Edit, SimpleForm, TextInput, SelectInput, useGetList } from "react-admin";

const ExpensesEdit = () => {
  
  
  
  
  const { data: category_idOptions } = useGetList("categories", {
    pagination: { page: 1, perPage: 100 },
  });
  
  

  return (
    <Edit>
      <SimpleForm>
        
        
        <TextInput source="amount" type="number" />
        
        
        
        <SelectInput 
          source="category_id"
          
          choices={category_idOptions?.map(record => ({
            id: record.id,
            name: record.name
          })) || []}
          
        />
        
        
      </SimpleForm>
    </Edit>
  );
};

export default ExpensesEdit;