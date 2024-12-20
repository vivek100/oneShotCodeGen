import React from "react";
import { Grid } from "@mui/material";
import Card from "../components/Card";
import Chart from "../components/Chart";
import Table from "../components/Table";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Form from "../components/Form";
import { Title } from "react-admin";

const Dashboard = () => {
  return (
    <div style={{ padding: '1rem' }}>
      <Title title="Dashboard" />
      
      <Grid container spacing={2} columns={12}>
        
        <Grid item xs={12} md={6}>
          
          <Card
            name="TotalApplications"
            provider="job_applications"
            title="Total Applications"
            column="id"
            operation="count"
            icon="assignment"
            color="#2196f3"
          />
          
        </Grid>
        
        <Grid item xs={12} md={6}>
          
          <Card
            name="CategoriesCount"
            provider="categories"
            title="Total Categories"
            column="id"
            operation="count"
            icon="category"
            color="#ff9800"
          />
          
        </Grid>
        
        <Grid item xs={12} md={6}>
          
          <Chart
            name="ApplicationStatusBreakdown"
            provider="job_applications"
            chartType="bar"
            config={{"x": "company_name", "y": "job_title"}}
          />
          
        </Grid>
        
      </Grid>
      
    </div>
  );
};

export default Dashboard;