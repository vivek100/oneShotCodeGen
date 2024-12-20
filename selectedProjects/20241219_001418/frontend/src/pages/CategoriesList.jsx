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

const CategoriesList = () => (
    <List>
        <Datagrid>
            
                
                    <TextField source="name" />
                
            
                
                    <TextField source="description" />
                
            
            
            
                
            
                
            
        </Datagrid>
    </List>
);

export default CategoriesList;