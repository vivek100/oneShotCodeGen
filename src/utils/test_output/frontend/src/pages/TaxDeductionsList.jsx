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

const TaxDeductionsList = () => (
    <List>
        <Datagrid>
            
                
                    <TextField source="tax_name" />
                
            
                
                    <NumberField source="tax_rate" />
                
            
            
            
                
                    <EditButton />
                
            
                
                    <DeleteButton 
                        confirmTitle="Delete Confirmation"
                        confirmContent="Are you sure you want to delete this record?"
                    />
                
            
        </Datagrid>
    </List>
);

export default TaxDeductionsList;