"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { mockApi } from "../lib/mockApi"
import { BarChart, TrendingUp, Users, DollarSign, Activity } from "lucide-react"

// Simplified props
interface MetricCardProps {
  title: string
  resource: string
  field: string
  aggregate: "sum" | "avg" | "count" | "max" | "min"
  filter?: Record<string, any>
  icon?: string
  color?: string
}

// Map of icon names to Lucide icons
const iconMap: Record<string, React.ReactNode> = {
  "bar-chart": <BarChart className="h-8 w-8" />,
  "trending-up": <TrendingUp className="h-8 w-8" />,
  users: <Users className="h-8 w-8" />,
  "dollar-sign": <DollarSign className="h-8 w-8" />,
  activity: <Activity className="h-8 w-8" />,
}

export default function MetricCard({
  title,
  resource,
  field,
  aggregate,
  filter = {},
  icon,
  color = "blue",
}: MetricCardProps) {
  const [value, setValue] = useState<string | number>("--")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await mockApi.aggregate(resource, {
          field,
          aggregate,
          filter,
        })

        setValue(result.result)
      } catch (err) {
        console.error("Error fetching metric data:", err)
        setError("Failed to load metric data")
        setValue("Error")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [resource, field, aggregate, JSON.stringify(filter)])

  // Determine the icon to display
  const iconElement = icon ? iconMap[icon] || <Activity className="h-8 w-8" /> : null

  // Color classes based on the color prop
  const colorClasses: Record<string, string> = {
    blue: "text-blue-500",
    green: "text-green-500",
    red: "text-red-500",
    yellow: "text-yellow-500",
    purple: "text-purple-500",
  }

  const iconColorClass = colorClasses[color] || colorClasses.blue

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {iconElement && <div className={iconColorClass}>{iconElement}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? "Loading..." : value}</div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
