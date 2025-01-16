import React from "react";
import { Grid } from "@mui/material";
import Card from "../components/Card";
import Chart from "../components/Chart";
import Table from "../components/Table";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Form from "../components/Form";
import { Title } from "react-admin";

const PayrollDashboard = () => {
  return (
    <div style={{ padding: '1rem' }}>
      <Title title="Payroll Dashboard" />
      
      <Grid container spacing={2} columns={12}>
        
        <Grid item xs={12} md={6}>
          
          <Card
            name="TotalSalaries"
            provider="payroll_records"
            title="Total Salaries Paid"
            column="gross_pay"
            operation="sum"
            icon="attach_money"
            color="#4caf50"
          />
          
        </Grid>
        
        <Grid item xs={12} md={6}>
          
          <Card
            name="TotalDeductions"
            provider="payroll_records"
            title="Total Deductions"
            column="deductions"
            operation="sum"
            icon="money_off"
            color="#f44336"
          />
          
        </Grid>
        
        <Grid item xs={12} md={6}>
          
          <Chart
            name="MonthlySalariesTrend"
            provider="monthly_salaries_report"
            chartType="line"
            config={{"x": "month", "y": "total_salaries"}}
            size={{"height": 400, "width": 600}}
          />
          
        </Grid>
        
      </Grid>
      
    </div>
  );
};

export default PayrollDashboard;