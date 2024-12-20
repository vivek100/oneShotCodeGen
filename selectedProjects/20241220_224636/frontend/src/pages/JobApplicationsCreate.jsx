import React from "react";
import { Create, SimpleForm, TextInput, SelectInput, useGetList } from "react-admin";

const JobApplicationsCreate = () => {
  
  
  
  
  
  
  
  
  
  
  const { data: category_idOptions } = useGetList("categories", {
    pagination: { page: 1, perPage: 100 },
  });
  
  

  return (
    <Create>
      <SimpleForm>
        
        
        <TextInput source="job_title" type="text" />
        
        
        
        <TextInput source="company_name" type="text" />
        
        
        
        <TextInput source="application_date" type="date" />
        
        
        
        <SelectInput 
          source="status" 
          
          choices={[{"label": "Applied", "value": "applied"}, {"label": "Interview", "value": "interview"}, {"label": "Offer", "value": "offer"}, {"label": "Rejected", "value": "rejected"}]}
          
        />
        
        
        
        <SelectInput 
          source="category_id" 
          
          choices={category_idOptions?.map(record => ({
            id: record.id,
            name: record.name
          })) || []}
          
        />
        
        
      </SimpleForm>
    </Create>
  );
};

export default JobApplicationsCreate;