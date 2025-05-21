import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container py-6 max-w-4xl mx-auto h-[calc(100vh-2rem)]">
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>New Project</CardTitle>
          <CardDescription>Preparing the new project interface...</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading interface...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 