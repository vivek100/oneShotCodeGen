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

const EmployeesList = () => (
    <List>
        <Datagrid>
            
                
                    <TextField source="email" />
                
            
                
                    <TextField source="full_name" />
                
            
                
                    <NumberField source="salary" />
                
            
                
                    <TextField source="tax_info" />
                
            
            
            
                
                    <EditButton />
                
            
                
                    <DeleteButton 
                        confirmTitle="Delete Confirmation"
                        confirmContent="Are you sure you want to delete this record?"
                    />
                
            
        </Datagrid>
    </List>
);

export default EmployeesList;