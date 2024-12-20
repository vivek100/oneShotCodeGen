import React from "react";
import { 
  List, 
  Datagrid, 
  TextField, 
  EditButton, 
  DeleteButton,
  NumberField,
  DateField
} from "react-admin";

const Table = ({ name, provider, cols, actions }) => {
  const getFieldComponent = (type) => {
    if (!type) return TextField;
    
    switch(type.toLowerCase()) {
      case 'number':
      case 'float':
      case 'integer':
        return NumberField;
      case 'date':
      case 'datetime':
        return DateField;
      default:
        return TextField;
    }
  };

  return (
    <List resource={provider}>
      <Datagrid>
        {cols?.map(col => {
          const FieldComponent = getFieldComponent(col?.type);
          return <FieldComponent key={col.field} source={col.field} label={col.header} />;
        })}
        {actions?.includes('edit') && <EditButton />}
        {actions?.includes('delete') && <DeleteButton />}
      </Datagrid>
    </List>
  );
};

export default Table;