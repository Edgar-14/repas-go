import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Section
 * Contenedor semántico sin tarjeta para secciones/encabezados de vista.
 * Reemplaza el uso de Card para "títulos" o barras de controles.
 */
export interface SectionProps {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
}

export function Section({ as: Component = "section", className, children }: SectionProps) {
  return (
    <Component className={cn("section-padding min-w-0", className)}>
      {children}
    </Component>
  );
}

/**
 * PageToolbar
 * Barra de controles universal (filtros + acciones) sin tarjeta.
 * - left: zona fluida (filtros/buscadores) con min-w-0 y w-full
 * - right: acciones con wrap (nunca se desbordan) y flex-shrink-0
 */
export interface PageToolbarProps {
  className?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export function PageToolbar({ className, left, right }: PageToolbarProps) {
  return (
    <div className={cn("flex items-center gap-3 md:gap-4 flex-wrap min-w-0", className)}>
      <div className="min-w-0 flex-1">
        {left}
      </div>
      <div className="flex items-center gap-2 md:gap-3 flex-wrap flex-shrink-0">
        {right}
      </div>
    </div>
  );
}

/**
 * Helpers para composición explícita si se prefiere <PageToolbar><ToolbarLeft/>...</ToolbarLeft>
 */
export function ToolbarLeft({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("min-w-0 flex-1", className)}>
      {children}
    </div>
  );
}

export function ToolbarRight({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-center gap-2 md:gap-3 flex-wrap flex-shrink-0", className)}>
      {children}
    </div>
  );
}
