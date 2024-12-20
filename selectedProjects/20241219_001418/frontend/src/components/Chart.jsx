import React, { useState, useEffect } from "react";
import {
  BarChart,
  LineChart,
  PieChart,
  Bar,
  Line,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Typography, Paper } from "@mui/material";
import { dataProvider } from "../providers/dataProvider";

const Chart = ({ name, provider, chartType, config, size }) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: result } = await dataProvider.getAll(provider);
        if (!result || result.length === 0) {
          setError("No data available");
          return;
        }
        setData(result);
      } catch (error) {
        console.error("Error loading chart data:", error);
        setError(error.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [provider]);

  if (loading) {
    return (
      <Paper
        style={{
          height: size?.height || 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "1rem 0",
        }}
      >
        <Typography variant="body1">Loading chart data...</Typography>
      </Paper>
    );
  }

  if (error || data.length === 0) {
    return (
      <Paper
        style={{
          height: size?.height || 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "grey",
          margin: "1rem 0",
        }}
      >
        <Typography
          variant="body1"
          color="textSecondary"
          style={{ textAlign: "center", padding: "1rem" }}
        >
          {error || "No data available to display"}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper style={{ margin: "1rem 0", padding: "1rem" }}>
      <Typography variant="h6" gutterBottom>
        {name}
      </Typography>
      <ResponsiveContainer width={size?.width || "100%"} height={size?.height || 300}>
        {chartType === "bar" && (
          <BarChart data={data}>
            <XAxis dataKey={config.x} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={config.y} fill="#8884d8" />
          </BarChart>
        )}
        {chartType === "line" && (
          <LineChart data={data}>
            <XAxis dataKey={config.x} />
            <YAxis />
            <Tooltip />
            <Line dataKey={config.y} stroke="#8884d8" />
          </LineChart>
        )}
        {chartType === "pie" && (
          <PieChart>
            <Tooltip />
            <Pie
              dataKey={config.y}
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label
            />
          </PieChart>
        )}
      </ResponsiveContainer>
    </Paper>
  );
};

export default Chart;
