import React, { useState, useEffect } from 'react';
import { TextField, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    try {
      await axios.post('http://localhost:3000/api/categories', { name: newCategory });
      setNewCategory('');
      fetchCategories();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/categories/${id}`);
      fetchCategories();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <TextField
        fullWidth
        label="New Category"
        variant="outlined"
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)}
      />
      <Button variant="contained" color="primary" onClick={handleAddCategory}>
        Add Category
      </Button>
      <List>
        {categories.map((category) => (
          <ListItem key={category.id} secondaryAction={
            <IconButton edge="end" onClick={() => handleDeleteCategory(category.id)}>
              <DeleteIcon />
            </IconButton>
          }>
            <ListItemText primary={category.name} />
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default CategoryManager;