"use client"

import { Card, CardContent } from "@/components/ui/card"

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string | number
  formatter?: (value: any, name: string, props: any) => [string, string]
}

export function CustomTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  // Kalau ada formatter dipakai, kalau tidak fallback payload asli
  const [value, name] = formatter
    ? formatter(payload[0].value, payload[0].name, payload[0])
    : [payload[0].value, payload[0].name]

  return (
    <Card className="rounded-lg border bg-card/95 backdrop-blur p-2 shadow-md">
      <CardContent className="p-0 text-sm space-y-1">
        {label && (
          <p className="font-medium text-foreground text-xs">{label}</p>
        )}
        <p className="text-foreground font-semibold">{value}</p>
        <p className="text-muted-foreground text-xs">{name}</p>
      </CardContent>
    </Card>
  )
}
