'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff } from 'lucide-react';

interface AuthFormProps {
  description?: string;
  buttonText?: string;
  showForgotPassword?: boolean;
  forgotPasswordHref?: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  emailPlaceholder?: string;
  color?: 'blue' | 'orange' | 'dark';
}

export function AuthForm({ 
  description,
  buttonText = 'Entrar',
  showForgotPassword = false,
  forgotPasswordHref,
  onSubmit, 
  isLoading = false,
  emailPlaceholder = 'Correo electrónico',
  color = 'blue'
}: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      onSubmit(email, password);
    }
  };

  const getLinkColorClass = () => {
    switch(color) {
      case 'blue':
        return 'text-blue-600 hover:text-blue-700';
      case 'orange':
        return 'text-orange-600 hover:text-orange-700';
      case 'dark':
        return 'text-gray-800 hover:text-gray-900';
      default:
        return 'text-blue-600 hover:text-blue-700';
    }
  };

  return (
    <div className="space-y-6">
      {description && (
        <p className="text-gray-600 text-center">{description}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={emailPlaceholder}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="relative space-y-2">
          <Input
            type={isPasswordVisible ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            disabled={isLoading}
            className="pr-12"
          />
          <button 
            type="button"
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-500 transition-colors"
            aria-label={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <Button
          type="submit"
          color={color}
          disabled={isLoading}
        >
          {isLoading ? 'Entrando...' : buttonText}
        </Button>
      </form>

      {showForgotPassword && forgotPasswordHref && (
        <div className="text-center">
          <Link 
            href={forgotPasswordHref} 
            className={`text-sm ${getLinkColorClass()} hover:underline`}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      )}
    </div>
  );
}
