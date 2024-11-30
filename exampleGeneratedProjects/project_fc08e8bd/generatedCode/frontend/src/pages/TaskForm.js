import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TextField, Button, Grid, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const TaskForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Low',
    status: 'To Do',
    categories: []
  });

  useEffect(() => {
    if (id) {
      axios.get(`http://localhost:3000/api/tasks/${id}`).then((response) => {
        setTask(response.data);
      });
    }
  }, [id]);

  const handleSubmit = async () => {
    try {
      if (id) {
        await axios.put(`http://localhost:3000/api/tasks/${id}`, task);
      } else {
        await axios.post('http://localhost:3000/api/tasks', task);
      }
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Title"
          variant="outlined"
          value={task.title}
          onChange={(e) => setTask({ ...task, title: e.target.value })}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Description"
          variant="outlined"
          multiline
          rows={4}
          value={task.description}
          onChange={(e) => setTask({ ...task, description: e.target.value })}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          type="date"
          label="Due Date"
          InputLabelProps={{ shrink: true }}
          variant="outlined"
          value={task.dueDate}
          onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
        />
      </Grid>
      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>Priority</InputLabel>
          <Select
            value={task.priority}
            onChange={(e) => setTask({ ...task, priority: e.target.value })}
          >
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="High">High</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={task.status}
            onChange={(e) => setTask({ ...task, status: e.target.value })}
          >
            <MenuItem value="To Do">To Do</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Save
        </Button>
        <Button variant="outlined" color="secondary" onClick={() => navigate('/')}>Cancel</Button>
      </Grid>
    </Grid>
  );
};

export default TaskForm;