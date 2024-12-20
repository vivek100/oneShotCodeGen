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
            name="TotalExpenses"
            provider="expenses"
            title="Total Expenses"
            column="amount"
            operation="sum"
            icon="attach_money"
            color="#4caf50"
          />
          
        </Grid>
        
        <Grid item xs={12} md={6}>
          
          <Chart
            name="MonthlyTrend"
            provider="monthly_expenses"
            chartType="line"
            config={{"x": "month", "y": "total_expenses"}}
            size={{"height": 400, "width": 600}}
          />
          
        </Grid>
        
      </Grid>
      
      <Grid container spacing={2} columns={12}>
        
        <Grid item xs={12} md={6}>
          
          <Card
            name="ExpenseCategoryCount"
            provider="categories"
            title="Expense Categories"
            column="id"
            operation="count"
            icon="category"
            color="#3f51b5"
          />
          
        </Grid>
        
        <Grid item xs={12} md={6}>
          
          <Chart
            name="CategoryDistribution"
            provider="category_totals"
            chartType="pie"
            config={{"x": "category_name", "y": "total_amount"}}
            size={{"height": 400, "width": 400}}
          />
          
        </Grid>
        
      </Grid>
      
    </div>
  );
};

export default Dashboard;