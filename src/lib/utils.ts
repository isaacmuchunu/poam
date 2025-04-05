import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) {
    return str
  }
  
  return str.slice(0, length) + "..."
}

export const severityColorMap = {
  Critical: "bg-red-500 text-white",
  High: "bg-orange-500 text-white",
  Moderate: "bg-yellow-500 text-black",
  Low: "bg-blue-500 text-white",
}

export const statusColorMap = {
  in_progress: "bg-blue-500 text-white",
  completed: "bg-green-500 text-white",
  delayed: "bg-orange-500 text-white",
  not_started: "bg-gray-500 text-white",
}

export function getSeverityColor(severity: string): string {
  return severityColorMap[severity as keyof typeof severityColorMap] || "bg-gray-500 text-white"
}

export function getStatusColor(status: string): string {
  return statusColorMap[status as keyof typeof statusColorMap] || "bg-gray-500 text-white"
}
