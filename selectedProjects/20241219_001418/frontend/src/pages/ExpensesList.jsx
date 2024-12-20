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

const ExpensesList = () => (
    <List>
        <Datagrid>
            
                
                    <NumberField source="amount" />
                
            
                
                    <TextField source="category_id" />
                
            
            
            
                
            
                
            
        </Datagrid>
    </List>
);

export default ExpensesList;