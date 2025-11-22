/**
 * Search Input Component
 * Consistent search input with icon and proper styling
 */

import React from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  onClear?: () => void
  disabled?: boolean
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
  onClear,
  disabled = false
}: SearchInputProps) {
  const handleClear = () => {
    onChange('')
    onClear?.()
  }

  return (
    <div className={cn("input-with-icon", className)}>
      <Search className="input-icon" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md",
          "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "bg-white text-gray-900 placeholder-gray-400",
          "disabled:bg-gray-50 disabled:text-gray-500",
          "transition-colors duration-200"
        )}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

/**
 * Generic Input with Icon Component
 */
interface InputWithIconProps {
  icon?: React.ComponentType<{ className?: string }>
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  className?: string
  disabled?: boolean
  error?: string
}

export function InputWithIcon({
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
  disabled = false,
  error
}: InputWithIconProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className={cn(
        "input-with-icon",
        error && "ring-2 ring-red-500"
      )}>
        {Icon && <Icon className="input-icon" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full py-2 border border-gray-300 rounded-md",
            "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "bg-white text-gray-900 placeholder-gray-400",
            "disabled:bg-gray-50 disabled:text-gray-500",
            "transition-colors duration-200",
            Icon ? "pl-10 pr-4" : "px-4",
            error && "border-red-500"
          )}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
