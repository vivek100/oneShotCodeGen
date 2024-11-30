import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, MenuItem } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/api';

function TaskForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Pending');
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await API.get('/categories');
      setCategories(response.data);
    };

    const fetchTask = async () => {
      if (id) {
        const response = await API.get(`/tasks/${id}`);
        const task = response.data;
        setTitle(task.title);
        setDescription(task.description);
        setDueDate(task.dueDate);
        setPriority(task.priority);
        setStatus(task.status);
        setCategoryId(task.categoryId);
      }
    };

    fetchCategories();
    fetchTask();
  }, [id]);

  const handleSubmit = async () => {
    const taskData = { title, description, dueDate, priority, status, categoryId };
    try {
      if (id) {
        await API.put(`/tasks/${id}`, taskData);
      } else {
        await API.post('/tasks', taskData);
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  return (
    <Box sx={{ padding: 2 }}>
      <TextField
        label="Title"
        fullWidth
        margin="normal"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <TextField
        label="Description"
        fullWidth
        margin="normal"
        multiline
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <TextField
        label="Due Date"
        type="date"
        fullWidth
        margin="normal"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label="Priority"
        select
        fullWidth
        margin="normal"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <MenuItem value="High">High</MenuItem>
        <MenuItem value="Medium">Medium</MenuItem>
        <MenuItem value="Low">Low</MenuItem>
      </TextField>
      <TextField
        label="Status"
        select
        fullWidth
        margin="normal"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <MenuItem value="Pending">Pending</MenuItem>
        <MenuItem value="In Progress">In Progress</MenuItem>
        <MenuItem value="Completed">Completed</MenuItem>
      </TextField>
      <TextField
        label="Category"
        select
        fullWidth
        margin="normal"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      >
        {categories.map((category) => (
          <MenuItem key={category.id} value={category.id}>
            {category.name}
          </MenuItem>
        ))}
      </TextField>
      <Button variant="contained" color="primary" onClick={handleSubmit}>
        Save Task
      </Button>
    </Box>
  );
}

export default TaskForm;