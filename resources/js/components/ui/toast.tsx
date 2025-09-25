import { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    onClose?: () => void;
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            onClose?.();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!isVisible) return null;

    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500',
    }[type];

    const icon = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ',
    }[type];

    return (
        <div
            className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[300px] animate-in slide-in-from-right`}
            style={{
                animation: 'slideInRight 0.3s ease-out',
            }}
        >
            <span className="text-lg">{icon}</span>
            <span className="flex-1">{message}</span>
            <button
                onClick={() => {
                    setIsVisible(false);
                    onClose?.();
                }}
                className="text-white hover:text-gray-200 ml-2"
            >
                ×
            </button>
        </div>
    );
}

interface ToastContextType {
    showToast: (message: string, type?: ToastProps['type']) => void;
}

let toastInstance: ((message: string, type?: ToastProps['type']) => void) | null = null;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastProps['type'] }>>([]);

    const showToast = (message: string, type: ToastProps['type'] = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    toastInstance = showToast;

    return (
        <>
            {children}
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </>
    );
}

export const toast = {
    success: (message: string) => toastInstance?.(message, 'success'),
    error: (message: string) => toastInstance?.(message, 'error'),
    warning: (message: string) => toastInstance?.(message, 'warning'),
    info: (message: string) => toastInstance?.(message, 'info'),
};