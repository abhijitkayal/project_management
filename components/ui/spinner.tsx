import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

type SpinnerFullscreenProps = React.ComponentProps<"div"> & {
  text?: string
}

function SpinnerFullscreen({ text = "Loading...", className, ...props }: SpinnerFullscreenProps) {
  return (
    <div
      className={cn("flex min-h-[40vh] w-full flex-col items-center justify-center gap-3", className)}
      {...props}
    >
      <Spinner className="size-6" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

export { Spinner, SpinnerFullscreen }
