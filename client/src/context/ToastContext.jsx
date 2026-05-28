import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

/**
 * Toast Context — lightweight notification system.
 *
 * Usage:
 *   const { addToast } = useToast();
 *   addToast('Item added!', 'success');
 *
 * Types: 'success' | 'error' | 'info'
 */
const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// ─── Icons per type ────────────────────────────────────

const TOAST_CONFIG = {
    success: {
        icon: CheckCircle,
        bg: 'bg-emerald-50 border-emerald-200',
        text: 'text-emerald-800',
        iconColor: 'text-emerald-500',
    },
    error: {
        icon: XCircle,
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-800',
        iconColor: 'text-red-500',
    },
    info: {
        icon: Info,
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-800',
        iconColor: 'text-blue-500',
    },
};

// ─── Single Toast ──────────────────────────────────────

function Toast({ toast, onRemove }) {
    const [isExiting, setIsExiting] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        timerRef.current = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onRemove(toast.id), 300);
        }, toast.duration);

        return () => clearTimeout(timerRef.current);
    }, [toast, onRemove]);

    const handleClose = () => {
        clearTimeout(timerRef.current);
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
    };

    const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
    const Icon = config.icon;

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm
                       ${config.bg} ${isExiting ? 'toast-exit' : 'toast-enter'}`}
            role="alert"
            aria-live="polite"
        >
            <Icon className={`w-5 h-5 shrink-0 ${config.iconColor}`} />
            <p className={`text-sm font-medium flex-1 ${config.text}`}>{toast.message}</p>
            <button
                onClick={handleClose}
                className="shrink-0 p-0.5 hover:opacity-70 transition-opacity"
                aria-label="Dismiss notification"
            >
                <X className={`w-4 h-4 ${config.text}`} />
            </button>
        </div>
    );
}

// ─── Container (portal) ────────────────────────────────

function ToastContainer({ toasts, removeToast }) {
    if (toasts.length === 0) return null;

    return createPortal(
        <div
            className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 pointer-events-auto"
            aria-label="Notifications"
        >
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>,
        document.body
    );
}
