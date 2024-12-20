import React from "react";
import { Grid } from "@mui/material";
import Card from "../components/Card";
import Chart from "../components/Chart";
import Table from "../components/Table";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Form from "../components/Form";
import { Title } from "react-admin";

const ManageJobCategories = () => {
  return (
    <div style={{ padding: '1rem' }}>
      <Title title="Manage Job Categories" />
      
      <Grid container spacing={2} columns={12}>
        
        <Grid item xs={12} md={12}>
          
          <Table
            name="CategoriesList"
            provider="categories"
            cols={[{"field": "name", "header": "Category Name"}, {"field": "description", "header": "Description"}]}
            actions={["edit", "delete"]}
          />
          
        </Grid>
        
      </Grid>
      
    </div>
  );
};

export default ManageJobCategories;