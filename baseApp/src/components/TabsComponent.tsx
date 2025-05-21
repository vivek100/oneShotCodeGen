"use client"

import { useState } from "react"
import { Card, CardContent } from "./ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import ComponentFactory from "./ComponentFactory"

// Simplified tab interface
interface Tab {
  title: string
  component: {
    type: string
    props: any
  }
}

// Simplified props
interface TabsComponentProps {
  layout?: "horizontal" | "vertical"
  loadOnClick?: boolean
  tabs: Tab[]
}

export default function TabsComponent({ layout = "horizontal", loadOnClick = false, tabs }: TabsComponentProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.title || "")
  const [loadedTabs, setLoadedTabs] = useState<string[]>(
    loadOnClick ? [tabs[0]?.title || ""] : tabs.map((tab) => tab.title),
  )

  const handleTabChange = (value: string) => {
    setActiveTab(value)

    if (loadOnClick && !loadedTabs.includes(value)) {
      setLoadedTabs((prev) => [...prev, value])
    }
  }

  if (tabs.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground">No tabs configured</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <Tabs
          defaultValue={tabs[0].title}
          value={activeTab}
          onValueChange={handleTabChange}
          className={layout === "vertical" ? "flex space-x-4" : ""}
        >
          <TabsList className={layout === "vertical" ? "flex-col h-auto" : ""}>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.title} value={tab.title}>
                {tab.title}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className={layout === "vertical" ? "flex-1" : ""}>
            {tabs.map((tab) => (
              <TabsContent key={tab.title} value={tab.title}>
                {(!loadOnClick || loadedTabs.includes(tab.title)) && (
                  <ComponentFactory type={tab.component.type} props={tab.component.props} />
                )}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
