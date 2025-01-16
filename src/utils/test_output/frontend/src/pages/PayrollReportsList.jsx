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

const PayrollReportsList = () => (
    <List>
        <Datagrid>
            
                
                    <TextField source="report_type" />
                
            
                
                    <TextField source="generated_on" />
                
            
            
            
        </Datagrid>
    </List>
);

export default PayrollReportsList;