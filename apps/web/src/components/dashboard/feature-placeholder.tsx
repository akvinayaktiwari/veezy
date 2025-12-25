'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface FeaturePlaceholderProps {
  icon: React.ReactNode
  title: string
  description: string
  features: string[]
}

export function FeaturePlaceholder({
  icon,
  title,
  description,
  features,
}: FeaturePlaceholderProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="text-muted-foreground h-16 w-16 md:h-20 md:w-20">
              {icon}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <CardTitle className="text-2xl md:text-3xl">{title}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                Coming Soon
              </Badge>
            </div>
            <CardDescription className="text-base">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
              Upcoming Features
            </h3>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-4 border-t">
            <Button disabled className="w-full" variant="secondary">
              Notify Me When Available
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
