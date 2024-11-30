import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Grid, TextField, Select, MenuItem, FormControl, InputLabel, Card, CardContent, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/tasks', {
        params: { status: filters.status, priority: filters.priority, search }
      });
      setTasks(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filters, search]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/tasks/${id}`);
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <Grid container spacing={2} style={{ marginBottom: '16px' }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Search"
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="To Do">To Do</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Button variant="contained" color="primary" onClick={() => navigate('/task/new')}>
        Add Task
      </Button>
      <Grid container spacing={2} style={{ marginTop: '16px' }}>
        {tasks.map((task) => (
          <Grid item xs={12} sm={6} md={4} key={task.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{task.title}</Typography>
                <Typography variant="body2">{task.description}</Typography>
                <Typography variant="body2">Priority: {task.priority}</Typography>
                <Typography variant="body2">Status: {task.status}</Typography>
                <Typography variant="body2">Due Date: {task.dueDate}</Typography>
                <Button onClick={() => navigate(`/task/edit/${task.id}`)}>Edit</Button>
                <Button color="error" onClick={() => handleDelete(task.id)}>Delete</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default TaskList;