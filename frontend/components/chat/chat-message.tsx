import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: {
    id: string
    role: "user" | "assistant" | "system" | "error"
    content: string
  }
}

export default function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "p-3 rounded-lg max-w-[85%]",
        message.role === "user" && "bg-primary text-primary-foreground ml-auto",
        message.role === "assistant" && "bg-muted",
        message.role === "system" && "bg-secondary text-secondary-foreground mx-auto text-sm italic",
        message.role === "error" && "bg-destructive text-destructive-foreground mx-auto",
      )}
    >
      {message.content}
    </div>
  )
}
