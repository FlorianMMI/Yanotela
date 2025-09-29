"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import ResetPasswordForm from '../auth/ResetPasswordForm';

export default function AuthSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleAuthSuccess = () => {
    // Le refresh sera géré par le hook useAuth dans le layout principal
    window.location.reload();
  };

  // Déterminer le formulaire à afficher en fonction de l'URL
  const getCurrentView = () => {
    if (pathname.startsWith('/register')) {
      return { view: 'register', token: null };
    } else if (pathname.startsWith('/forgot-password')) {
      // Vérifie si l'URL est /forgot-password/:token
      const match = pathname.match(/^\/forgot-password\/(.+)/);
      if (match && match[1]) {
        return { view: 'reset', token: match[1] };
      }
      return { view: 'forgot', token: null };
    } else {
      return { view: 'login', token: null }; // Par défaut pour /login et toutes les autres pages
    }
  };

  const { view: currentView, token } = getCurrentView();

  return (
    <div className="p-6">
      {currentView === 'login' && (
        <LoginForm
          onSuccess={handleAuthSuccess}
          onSwitchToRegister={() => router.push('/register')}
          onSwitchToForgot={() => router.push('/forgot-password')}
          isInSidebar={true}
        />
      )}
      
      {currentView === 'register' && (
        <RegisterForm
          onSuccess={() => router.push('/login')}
          onSwitchToLogin={() => router.push('/login')}
          isInSidebar={true} 
        />
      )}
      
      {currentView === 'forgot' && (
        <ForgotPasswordForm
          onSuccess={() => router.push('/login')}
          onSwitchToLogin={() => router.push('/login')}
        />
      )}

      {currentView === 'reset' && token && (
        <ResetPasswordForm
          token={token}
          onSuccess={() => router.push('/login')}
        />
      )}
    </div>
  );
}