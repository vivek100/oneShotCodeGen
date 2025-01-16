import React from "react";
import { Grid } from "@mui/material";
import Card from "../components/Card";
import Chart from "../components/Chart";
import Table from "../components/Table";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Form from "../components/Form";
import { Title } from "react-admin";

const PayrollReportsGeneration = () => {
  return (
    <div style={{ padding: '1rem' }}>
      <Title title="Payroll Reports Generation" />
      
      <Grid container spacing={2} columns={12}>
        
        <Grid item xs={12} md={6}>
          
          <Form
            name="ReportGenerationForm"
            provider=""
            fields={[{"field": "report_type", "options": [{"label_field": "report_type", "provider": "payroll_reports", "select_options": [{"id": "monthly", "name": "Monthly", "value": "monthly"}, {"id": "yearly", "name": "Yearly", "value": "yearly"}], "select_type": "static", "value_field": "id"}], "required": true, "type": "select"}]}
            submit="generate"
          />
          
        </Grid>
        
        <Grid item xs={12} md={6}>
          
          <Table
            name="GeneratedReportsList"
            provider="payroll_reports"
            cols={[{"field": "report_type", "header": "Report Type"}, {"field": "generated_on", "header": "Generated On"}]}
            actions={[]}
          />
          
        </Grid>
        
      </Grid>
      
    </div>
  );
};

export default PayrollReportsGeneration;