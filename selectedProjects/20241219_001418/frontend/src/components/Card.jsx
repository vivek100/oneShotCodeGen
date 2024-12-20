// Card.jsx
import React, { useState, useEffect } from "react";
import { Card as MuiCard, CardContent, Typography } from "@mui/material";
import Icon from '@mui/material/Icon';
import { dataProvider } from "../providers/dataProvider";

const Card = ({ name, provider, title, column, operation, icon, color }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: result } = await dataProvider.aggregate(provider, {
          column,
          operation
        });
        setData(result);
      } catch (error) {
        console.error('Error loading card data:', error);
        setError(error.message || 'Failed to load data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [provider, column, operation]);

  const renderContent = () => {
    if (loading) {
      return "Loading...";
    }
    if (error) {
      return "Error loading data";
    }
    if (data === null || data === undefined) {
      return "No data available";
    }
    return data.toLocaleString();
  };

  return (
    <MuiCard style={{ backgroundColor: color || "white", margin: "1rem 0" }}>
      <CardContent>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
          <Typography variant="h6">{title}</Typography>
        </div>
        <Typography 
          variant="h4"
          style={{ 
            color: error ? '#f44336' : 'inherit',
            fontSize: error ? '1rem' : '2rem'
          }}
        >
          {renderContent()}
        </Typography>
      </CardContent>
    </MuiCard>
  );
};

export default Card;