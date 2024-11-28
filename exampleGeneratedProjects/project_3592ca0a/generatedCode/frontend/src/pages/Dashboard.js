import React, { useEffect, useState } from 'react';
import { Button, Box, Typography, List, ListItem, ListItemText } from '@mui/material';
import API from '../api/api';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await API.get('/tasks');
        setTasks(response.data);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      }
    };
    fetchTasks();
  }, []);

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4">Dashboard</Typography>
      <Button variant="contained" color="primary" onClick={() => navigate('/tasks/new')}>
        Add Task
      </Button>
      <List>
        {tasks.map((task) => (
          <ListItem key={task.id} button onClick={() => navigate(`/tasks/edit/${task.id}`)}>
            <ListItemText primary={task.title} secondary={`Priority: ${task.priority}`} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default Dashboard;