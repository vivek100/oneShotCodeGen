import MetricCard from "./MetricCard"
import DataTable from "./DataTable"
import SimpleForm from "./SimpleForm"
import WizardForm from "./WizardForm"
import Chart from "./Chart"
import TabsComponent from "./TabsComponent"

interface ComponentFactoryProps {
  type: string
  props: any
}

export default function ComponentFactory({ type, props }: ComponentFactoryProps) {
  switch (type) {
    case "MetricCard":
      return <MetricCard {...props} />
    case "DataTable":
      return <DataTable {...props} />
    case "SimpleForm":
      return <SimpleForm {...props} />
    case "WizardForm":
      return <WizardForm {...props} />
    case "Chart":
      return <Chart {...props} />
    case "TabsComponent":
      return <TabsComponent {...props} />
    default:
      return (
        <div className="rounded-md border border-destructive p-4 text-destructive">Unknown component type: {type}</div>
      )
  }
}
