import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

const exampleMessages = [
  {
    heading: 'What happened to Pune Porche Case?',
    message: 'What happened to Pune Porche Case?'
  },
  {
    heading: 'How many people died in 2024 TN hooch tragedy?',
    message: 'How many people died in 2024 TN hooch tragedy?'
  },
  {
    heading: 'What were the key points of India Union Budget 2024?',
    message: 'What were the key points of India Union Budget 2024?'
  },
  {
    heading: 'Compare Mahindra vs Tata in EV',
    message: 'Compare Mahindra vs Tata in EV'
  }
]
export function EmptyScreen({
  submitMessage,
  className
}: {
  submitMessage: (message: string) => void
  className?: string
}) {
  return (
    <div className={`mx-auto w-full transition-all ${className}`}>
      <div className="bg-background p-2">
        <div className="mt-4 flex flex-col items-start space-y-2 mb-4">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              name={message.message}
              onClick={async () => {
                submitMessage(message.message)
              }}
            >
              <ArrowRight size={16} className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
