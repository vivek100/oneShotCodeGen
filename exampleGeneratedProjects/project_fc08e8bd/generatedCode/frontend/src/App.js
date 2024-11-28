import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TaskList from './pages/TaskList';
import TaskForm from './pages/TaskForm';
import CategoryManager from './pages/CategoryManager';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<TaskList />} />
      <Route path="/task/new" element={<TaskForm />} />
      <Route path="/task/edit/:id" element={<TaskForm />} />
      <Route path="/categories" element={<CategoryManager />} />
    </Routes>
  );
};

export default App;