import React, { useState, useEffect } from "react";
import { TextField, Button, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { dataProvider } from "../providers/dataProvider";

const Form = ({ name, fields, submit, provider }) => {
  const [formData, setFormData] = useState({});
  const [selectOptions, setSelectOptions] = useState({});

  useEffect(() => {
    // Load options for dynamic select fields
    const loadSelectOptions = async () => {
      const optionsMap = {};
      
      for (const field of fields) {
        if (field.type === "select" && field.select_type === "dynamic") {
          try {
            const { data } = await dataProvider.getAll(field.provider);
            optionsMap[field.field] = data.map(item => ({
              value: item[field.value_field],
              label: item[field.label_field]
            }));
          } catch (error) {
            console.error(`Error loading options for ${field.field}:`, error);
            optionsMap[field.field] = [];
          }
        }
      }
      
      setSelectOptions(optionsMap);
    };

    loadSelectOptions();
  }, [fields]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dataProvider[submit](provider, { data: formData });
      console.log(`Form submitted: ${submit} is the submit action`);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderField = (field, index) => {
    if (field.type === "select") {
      const options = field.select_type === "dynamic" 
        ? selectOptions[field.field] || []
        : field.select_options || [];

      return (
        <FormControl key={index} fullWidth margin="normal">
          <InputLabel>{field.label || field.field}</InputLabel>
          <Select
            label={field.label || field.field}
            required={field.required}
            value={formData[field.field] || ''}
            onChange={(e) => handleChange(field.field, e.target.value)}
          >
            {options.map(option => (
              <MenuItem 
                key={option.value || option} 
                value={option.value || option}
              >
                {option.label || option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    return (
      <TextField
        key={index}
        fullWidth
        margin="normal"
        label={field.label || field.field}
        required={field.required}
        type={field.type}
        value={formData[field.field] || ''}
        onChange={(e) => handleChange(field.field, e.target.value)}
      />
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      {fields.map((field, index) => renderField(field, index))}
      <Button 
        type="submit" 
        variant="contained" 
        color="primary" 
        style={{ marginTop: '1rem' }}
      >
        {submit}
      </Button>
    </form>
  );
};

export default Form;