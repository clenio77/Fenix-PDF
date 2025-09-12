'use client';

import { Toaster } from 'react-hot-toast';

export default function NotificationProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1f2937',
          color: '#f9fafb',
          border: '1px solid #374151',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#f9fafb',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#f9fafb',
          },
        },
        loading: {
          iconTheme: {
            primary: '#3b82f6',
            secondary: '#f9fafb',
          },
        },
      }}
    />
  );
}
