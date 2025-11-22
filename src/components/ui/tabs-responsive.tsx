'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import { useBreakpoints } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-start rounded-md bg-muted p-1',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

interface ResponsiveTabsProps {
  tabs: Array<{
    value: string;
    label: string;
    icon?: React.ReactNode;
    content: React.ReactNode;
  }>;
  defaultValue?: string;
  className?: string;
  showAsSelect?: boolean;
}

/**
 * Responsive Tabs component that switches to select dropdown on mobile
 */
export function ResponsiveTabs({
  tabs,
  defaultValue,
  className,
  showAsSelect: forceSelect = false,
}: ResponsiveTabsProps) {
  const { isMobile } = useBreakpoints();
  const [activeTab, setActiveTab] = React.useState(
    defaultValue || tabs[0]?.value || ''
  );

  const showAsSelect = forceSelect || (isMobile && tabs.length > 4);

  if (showAsSelect) {
    return (
      <div className={cn('space-y-4', className)}>
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                {tab.icon && <span className="mr-2">{tab.icon}</span>}
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="space-y-4">
          {tabs.find((t) => t.value === activeTab)?.content}
        </div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className={className}>
      <TabsList className="grid w-full overflow-x-auto scrollbar-hide" style={{ gridTemplateColumns: `repeat(${Math.min(tabs.length, 4)}, minmax(0, 1fr))` }}>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
            {tab.icon && <span className="mr-1 sm:mr-2">{tab.icon}</span>}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="space-y-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
