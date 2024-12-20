import React from "react";
import { 
    List, 
    Datagrid, 
    TextField, 
    NumberField,
    DateField,
    EditButton, 
    DeleteButton 
} from "react-admin";

const JobApplicationsList = () => (
    <List>
        <Datagrid>
            
                
                    <TextField source="job_title" />
                
            
                
                    <TextField source="company_name" />
                
            
                
                    <DateField source="application_date" />
                
            
                
                    <TextField source="status" />
                
            
                
                    <TextField source="category_id" />
                
            
            
            
                
            
                
            
                
            
        </Datagrid>
    </List>
);

export default JobApplicationsList;