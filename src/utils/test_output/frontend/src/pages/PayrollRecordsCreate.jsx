import React from "react";
import { Create, SimpleForm, TextInput, SelectInput, useGetList } from "react-admin";

const PayrollRecordsCreate = () => {
  
  
  const { data: employee_idOptions } = useGetList("employees", {
    pagination: { page: 1, perPage: 100 },
  });
  
  
  
  
  
  
  
  
  
  
  
  

  return (
    <Create>
      <SimpleForm>
        
        
        <SelectInput 
          source="employee_id" 
          
          choices={ employee_idOptions && employee_idOptions.map(record => ({
            id: record.id,
            name: record.full_name,
            value: record.id
          })) || []}
          
          optionText="name"
          optionValue="value"
        />
        
        
        
        <TextInput source="pay_period_start" type="date" />
        
        
        
        <TextInput source="pay_period_end" type="date" />
        
        
        
        <TextInput source="gross_pay" type="number" />
        
        
        
        <TextInput source="deductions" type="number" />
        
        
        
        <TextInput source="net_pay" type="number" />
        
        
      </SimpleForm>
    </Create>
  );
};

export default PayrollRecordsCreate;