/**
 * Mobile Navigation Component
 * Hamburger menu and mobile-friendly navigation
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { useBreakpoints } from '@/hooks/use-mobile'

interface NavItem {
  href: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  children?: NavItem[]
}

interface MobileNavProps {
  items: NavItem[]
  className?: string
  onItemClick?: () => void
}

export function MobileNav({ items, className, onItemClick }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const pathname = usePathname()
  const { isMobile } = useBreakpoints()

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const toggleExpanded = (href: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(href)) {
      newExpanded.delete(href)
    } else {
      newExpanded.add(href)
    }
    setExpandedItems(newExpanded)
  }

  const handleItemClick = () => {
    setIsOpen(false)
    onItemClick?.()
  }

  if (!isMobile) {
    return null
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMenu}
        className="md:hidden"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <nav className={cn(
        'fixed top-0 left-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 md:hidden',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        className
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Menú</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {items.map((item) => (
                <NavItemComponent
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  expandedItems={expandedItems}
                  onToggleExpanded={toggleExpanded}
                  onItemClick={handleItemClick}
                  level={0}
                />
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </>
  )
}

interface NavItemComponentProps {
  item: NavItem
  pathname: string
  expandedItems: Set<string>
  onToggleExpanded: (href: string) => void
  onItemClick: () => void
  level: number
}

function NavItemComponent({
  item,
  pathname,
  expandedItems,
  onToggleExpanded,
  onItemClick,
  level
}: NavItemComponentProps) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const isExpanded = expandedItems.has(item.href)
  const hasChildren = item.children && item.children.length > 0
  const IconComponent = item.icon

  return (
    <li>
      <div className={cn(
        'flex items-center rounded-lg transition-colors',
        level > 0 && 'ml-4'
      )}>
        {hasChildren ? (
          <button
            onClick={() => onToggleExpanded(item.href)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-left w-full transition-colors',
              isActive 
                ? 'bg-blue-100 text-blue-700 font-medium' 
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            {IconComponent && (
              <IconComponent className="h-5 w-5 flex-shrink-0" />
            )}
            <span className="flex-1">{item.label}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <Link
            href={item.href}
            onClick={onItemClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg w-full transition-colors',
              isActive 
                ? 'bg-blue-100 text-blue-700 font-medium' 
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            {IconComponent && (
              <IconComponent className="h-5 w-5 flex-shrink-0" />
            )}
            <span>{item.label}</span>
          </Link>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <ul className="mt-1 space-y-1">
          {item.children!.map((child) => (
            <NavItemComponent
              key={child.href}
              item={child}
              pathname={pathname}
              expandedItems={expandedItems}
              onToggleExpanded={onToggleExpanded}
              onItemClick={onItemClick}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

/**
 * Simple Mobile Menu Toggle Button
 */
interface MobileMenuToggleProps {
  isOpen: boolean
  onToggle: () => void
  className?: string
}

export function MobileMenuToggle({ isOpen, onToggle, className }: MobileMenuToggleProps) {
  const { isMobile } = useBreakpoints()

  if (!isMobile) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={cn('md:hidden', className)}
    >
      {isOpen ? (
        <X className="h-6 w-6" />
      ) : (
        <Menu className="h-6 w-6" />
      )}
      <span className="sr-only">Toggle menu</span>
    </Button>
  )
}
