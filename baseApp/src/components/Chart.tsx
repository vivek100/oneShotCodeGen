"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { mockApi } from "../lib/mockApi"
import { Loader2 } from "lucide-react"
import {
  Bar,
  BarChart as RechartsBarChart,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  Area,
  AreaChart as RechartsAreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"

// Updated ChartProps interface to include reference options for xField and yField
interface ChartProps {
  title?: string
  chartType: "bar" | "line" | "pie" | "area" | "doughnut"
  resource: string
  xField: string // Changed to allow reference
  yField: string // Changed to allow reference
  transform?: "sum" | "avg" | "count"
  filter?: Record<string, any>
  groupBy?: string
  xFieldReference?: { // New optional property for xField
    resource: string; // The resource to fetch from
    displayField: string; // The field to use as display value
    valueField: string; // The field that matches the ID (e.g., 'id')
  };
  yFieldReference?: { // New optional property for yField
    resource: string;
    displayField: string;
    valueField: string;
  };
}

// Chart colors
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", "#00c49f", "#ffbb28", "#ff8042"]

export default function Chart({
  title,
  chartType,
  resource,
  xField,
  yField,
  transform = "sum",
  filter = {},
  groupBy,
  xFieldReference,
  yFieldReference,
}: ChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
    
        // Fetch the data
        const result = await mockApi.getList(resource, { filter });
    
        if (!result.data || result.data.length === 0) {
          setData([]);
          return;
        }
    
        let processedData: any[] = result.data;  // Start with raw data
    
        // Process references if provided
        if (xFieldReference || yFieldReference) {
          const enrichedData = await Promise.all(processedData.map(async (item) => {
            let enrichedItem = { ...item };
            
            if (xFieldReference && item[xField] && item[xField] === item[xFieldReference.valueField]) {  // Check if xField is a reference ID
              const refResult = await mockApi.getList(xFieldReference.resource, { filter: { [xFieldReference.valueField]: item[xField] } });
              if (refResult.data && refResult.data.length > 0) {
                enrichedItem[xField] = refResult.data[0][xFieldReference.displayField];  // Replace with display value
              }
            }
            
            if (yFieldReference && item[yField] && item[yFieldReference.valueField]) {  // Check if yField is a reference ID
              const refResult = await mockApi.getList(yFieldReference.resource, { filter: { [yFieldReference.valueField]: item[yField] } });
              if (refResult.data && refResult.data.length > 0) {
                enrichedItem[yField] = refResult.data[0][yFieldReference.displayField];  // Replace with display value
              }
            }
            
            return enrichedItem;
          }));
          
          processedData = enrichedData;
        }
    
        if (groupBy) {
          const groupedData = processedData.reduce((acc: any, item: any) => {
            const groupValue = item[groupBy];
            if (!acc[groupValue]) {
              acc[groupValue] = [];
            }
            acc[groupValue].push(item);
            return acc;
          }, {});
        
          if (chartType === "bar" || chartType === "pie" || chartType === "doughnut") {
            // Flatten for bar/pie/doughnut
            const flatEntry: any = { [xField]: "All Departments" };
            Object.entries(groupedData).forEach(([groupValue, items]) => {
              let value = 0;
              switch (transform) {
                case "sum":
                  value = items.reduce((sum, item) => sum + (Number(item[yField]) || 0), 0);
                  break;
                case "avg":
                  value = items.reduce((sum, item) => sum + (Number(item[yField]) || 0), 0) / items.length;
                  break;
                case "count":
                  value = items.length;
                  break;
              }
              flatEntry[groupValue] = value;
            });
            processedData = [flatEntry];
          } else {
            // Keep separate records for line/area
            processedData = Object.entries(groupedData).map(([groupValue, items]) => {
              let value = 0;
              switch (transform) {
                case "sum":
                  value = items.reduce((sum, item) => sum + (Number(item[yField]) || 0), 0);
                  break;
                case "avg":
                  value = items.reduce((sum, item) => sum + (Number(item[yField]) || 0), 0) / items.length;
                  break;
                case "count":
                  value = items.length;
                  break;
              }
              return {
                [xField]: groupValue,
                [yField]: value,
              };
            });
          }
        }
         else {
          // No grouping, just aggregate by xField
          const groupedByX = processedData.reduce((acc: any, item: any) => {
            const xValue = item[xField];
            if (!acc[xValue]) {
              acc[xValue] = [];
            }
            acc[xValue].push(item);
            return acc;
          }, {});
    
          processedData = Object.entries(groupedByX).map(([xValue, items]) => {
            let value = 0;
            switch (transform) {
              case "sum":
                value = items.reduce((sum, item) => sum + (Number(item[yField]) || 0), 0);
                break;
              case "avg":
                value = items.reduce((sum, item) => sum + (Number(item[yField]) || 0), 0) / items.length;
                break;
              case "count":
                value = items.length;
                break;
            }
    
            return {
              [xField]: xValue,
              [yField]: value,
            };
          });
        }
    
        setData(processedData);
      } catch (err) {
        console.error("Error fetching chart data:", err);
        setError("Failed to load chart data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData()
    // Use a stable reference for filter object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, xField, yField, groupBy, transform, JSON.stringify(filter), xFieldReference, yFieldReference])

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex h-64 items-center justify-center">
          <p className="text-destructive">{error}</p>
        </div>
      )
    }

    if (data.length === 0) {
      return (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      )
    }
    console.log("chart data:", data, "chartType:", chartType)
    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xField} />
              <YAxis />
              <Tooltip />
              <Legend />
              {groupBy ? (
                // If grouped, create a Bar for each group
                Object.keys(data[0])
                  .filter((key) => key !== xField)
                  .map((key, index) => (
                    <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} />
                  ))
              ) : (
                // Otherwise, just one Bar for the yField
                <Bar dataKey={yField} fill="#8884d8" />
              )}
            </RechartsBarChart>
          </ResponsiveContainer>
        )
      case "line":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <RechartsLineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xField} />
              <YAxis />
              <Tooltip />
              <Legend />
              {groupBy ? (
                // If grouped, create a Line for each group
                data.map((item, index) => {
                  return <Line key={item[xField]} type="monotone" dataKey={item[xField]} stroke={COLORS[index % COLORS.length]} />
                })
                // Object.keys(data[0])
                //   .filter((key) => key !== xField)
                //   .map((key, index) => (
                //     <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} />
                //   ))
              ) : (
                // Otherwise, just one Line for the yField
                <Line type="monotone" dataKey={yField} stroke="#8884d8" />
              )}
            </RechartsLineChart>
          </ResponsiveContainer>
        )
      case "area":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <RechartsAreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xField} />
              <YAxis />
              <Tooltip />
              <Legend />
              {groupBy ? (
                // If grouped, create an Area for each group
                Object.keys(data[0])
                  .filter((key) => key !== xField)
                  .map((key, index) => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      fill={COLORS[index % COLORS.length]}
                      stroke={COLORS[index % COLORS.length]}
                    />
                  ))
              ) : (
                // Otherwise, just one Area for the yField
                <Area type="monotone" dataKey={yField} fill="#8884d8" stroke="#8884d8" />
              )}
            </RechartsAreaChart>
          </ResponsiveContainer>
        )
      case "pie":
      case "doughnut":
        // For pie charts, we need to transform the data
        const pieData = groupBy
          ? Object.keys(data[0])
              .filter((key) => key !== xField)
              .map((key) => ({
                name: key,
                value: data.reduce((sum, item) => sum + (Number(item[key]) || 0), 0),
              }))
          : data.map((item) => ({
              name: item[xField],
              value: item[yField],
            }))

        return (
          <ResponsiveContainer width="100%" height={350}>
            <RechartsPieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <Tooltip />
              <Legend />
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={chartType === "doughnut" ? 100 : 80}
                innerRadius={chartType === "doughnut" ? 60 : 0}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </RechartsPieChart>
          </ResponsiveContainer>
        )
      default:
        return (
          <div className="flex h-64 items-center justify-center">
            <p className="text-destructive">Unsupported chart type: {chartType}</p>
          </div>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || `${resource} ${chartType} chart`}</CardTitle>
      </CardHeader>
      <CardContent>{renderChart()}</CardContent>
    </Card>
  )
}
