import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { useNotifications, NotificationType } from '@/lib/notifications';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

interface ToastProps {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  onDismiss: (id: string) => void;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export function Toast({ id, type, title, message, onDismiss, actions }: ToastProps) {
  const Icon = iconMap[type];

  return (
    <div className={cn(
      'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden',
      colorMap[type]
    )}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium">{title}</p>
            {message && (
              <p className="mt-1 text-sm opacity-90">{message}</p>
            )}
            {actions && actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={action.action}
                    className="text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(id)}
              className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none p-1"
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { notifications, dismiss } = useNotifications();

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            id={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onDismiss={dismiss}
            actions={notification.actions}
          />
        ))}
      </div>
    </div>
  );
}
