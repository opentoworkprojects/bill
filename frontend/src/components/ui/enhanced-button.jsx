import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95 hover:shadow-md",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 active:bg-primary/95",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/95",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:bg-secondary/90",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline active:text-primary/80",
        success: "bg-green-600 text-white shadow hover:bg-green-700 active:bg-green-800",
        warning: "bg-yellow-600 text-white shadow hover:bg-yellow-700 active:bg-yellow-800",
        info: "bg-blue-600 text-white shadow hover:bg-blue-700 active:bg-blue-800",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-md px-10 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const EnhancedButton = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  asChild = false, 
  loading = false,
  loadingText = "Loading...",
  disabled,
  onClick,
  children,
  debounceMs = 300,
  hapticFeedback = true,
  soundFeedback = false,
  ...props 
}, ref) => {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [lastClickTime, setLastClickTime] = React.useState(0)
  const timeoutRef = React.useRef(null)
  
  // Debounced click handler to prevent rapid clicks
  const handleClick = React.useCallback(async (event) => {
    const now = Date.now()
    
    // Prevent rapid clicks
    if (now - lastClickTime < debounceMs) {
      event.preventDefault()
      return
    }
    
    setLastClickTime(now)
    
    // Haptic feedback for mobile devices
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(10) // Very short vibration
    }
    
    // Sound feedback (optional)
    if (soundFeedback) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (AudioContext) {
          const audioContext = new AudioContext()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.05)
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.1)
        }
      } catch (e) {
        // Silently fail if audio not supported
      }
    }
    
    if (onClick) {
      setIsProcessing(true)
      
      try {
        // Handle both sync and async onClick handlers
        const result = onClick(event)
        if (result instanceof Promise) {
          await result
        }
      } catch (error) {
        console.error('Button click error:', error)
      } finally {
        // Clear processing state after a minimum time to prevent flashing
        timeoutRef.current = setTimeout(() => {
          setIsProcessing(false)
        }, 150)
      }
    }
  }, [onClick, debounceMs, hapticFeedback, soundFeedback, lastClickTime])
  
  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  const isDisabled = disabled || loading || isProcessing
  const showLoading = loading || isProcessing
  
  const Comp = asChild ? Slot : "button"
  
  return (
    <Comp
      className={cn(
        buttonVariants({ variant, size, className }),
        showLoading && "cursor-wait",
        isDisabled && "cursor-not-allowed"
      )}
      ref={ref}
      disabled={isDisabled}
      onClick={handleClick}
      {...props}
    >
      {showLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Comp>
  )
})

EnhancedButton.displayName = "EnhancedButton"

export { EnhancedButton, buttonVariants }