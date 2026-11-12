import React from 'react';
import AuthCard from '@/components/AuthCard';

export const metadata = {
  title: 'Create Account — beTalky',
  description: 'Create an account on beTalky to start your AI English speaking practice.',
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col justify-center items-center px-3 sm:px-6 py-6 sm:py-10 antialiased">
      <AuthCard initialMode="signup" />
    </div>
  );
}
