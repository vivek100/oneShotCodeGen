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

const PayrollRecordsList = () => (
    <List>
        <Datagrid>
            
                
                    <TextField source="employee_id" />
                
            
                
                    <DateField source="pay_period_start" />
                
            
                
                    <DateField source="pay_period_end" />
                
            
                
                    <NumberField source="gross_pay" />
                
            
                
                    <NumberField source="deductions" />
                
            
                
                    <NumberField source="net_pay" />
                
            
            
            
                
                    <EditButton />
                
            
                
                    <DeleteButton 
                        confirmTitle="Delete Confirmation"
                        confirmContent="Are you sure you want to delete this record?"
                    />
                
            
        </Datagrid>
    </List>
);

export default PayrollRecordsList;