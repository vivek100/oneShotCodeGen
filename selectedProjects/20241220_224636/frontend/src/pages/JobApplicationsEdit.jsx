import React from "react";
import { Edit, SimpleForm, TextInput, SelectInput, useGetList } from "react-admin";

const JobApplicationsEdit = () => {
  const { data: category_idOptions } = useGetList("categories", {
    pagination: { page: 1, perPage: 100 },
  });

  return (
    <Edit>
      <SimpleForm>
        <TextInput source="job_title" type="text" />
        <TextInput source="company_name" type="text" />
        <TextInput source="application_date" type="date" />
        
        <SelectInput 
          source="status"
          choices={[
            {"id": "applied", "name": "Applied", "value": "applied"},
            {"id": "interview", "name": "Interview", "value": "interview"},
            {"id": "offer", "name": "Offer", "value": "offer"},
            {"id": "rejected", "name": "Rejected", "value": "rejected"}
          ]}
          optionText="name"
          optionValue="value"
        />
        
        <SelectInput 
          source="category_id"
          choices={category_idOptions?.map(record => ({
            id: record.id,
            name: record.name,
            value: record.id
          })) || []}
          optionText="name"
          optionValue="value"
        />
      </SimpleForm>
    </Edit>
  );
};

export default JobApplicationsEdit;