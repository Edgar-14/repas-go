// Prompts centralizados para todos los bots de BeFast
import { getWelcomePromptTemplate, WELCOME_CONFIG } from './welcome.prompt';
import { getDriverPromptTemplate, DRIVER_CONFIG } from './driver.prompt';
import { getBusinessPromptTemplate, BUSINESS_CONFIG } from './business.prompt';
import { getAdminPromptTemplate, ADMIN_CONFIG } from './admin.prompt';

export { getWelcomePromptTemplate, WELCOME_CONFIG, getDriverPromptTemplate, DRIVER_CONFIG, getBusinessPromptTemplate, BUSINESS_CONFIG, getAdminPromptTemplate, ADMIN_CONFIG };

// Función para obtener el prompt correcto según el rol
export function getPromptForRole(userRole: string, userData: Record<string, any>): string {
  switch (userRole) {
    case 'WELCOME':
      return getWelcomePromptTemplate(userData);
    case 'DRIVER':
      return getDriverPromptTemplate(userData);
    case 'BUSINESS':
      return getBusinessPromptTemplate(userData);
    case 'ADMIN':
      return getAdminPromptTemplate(userData);
    default:
      return getWelcomePromptTemplate(userData);
  }
}

// Función para obtener la configuración UI según el rol
export function getConfigForRole(userRole: string) {
  switch (userRole) {
    case 'WELCOME':
      return WELCOME_CONFIG;
    case 'DRIVER':
      return DRIVER_CONFIG;
    case 'BUSINESS':
      return BUSINESS_CONFIG;
    case 'ADMIN':
      return ADMIN_CONFIG;
    default:
      return WELCOME_CONFIG;
  }
}