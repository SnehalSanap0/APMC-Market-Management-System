import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

let _toastId = 0;

/**
 * Provides toast notifications to the entire app.
 * Wrap your app (or a subtree) with <ToastProvider>.
 */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef({});

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
        // Remove from DOM after CSS exit animation (300ms)
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            delete timers.current[id];
        }, 350);
    }, []);

    const toast = useCallback(({ message, type = 'success', duration = 3500 }) => {
        const id = ++_toastId;
        setToasts(prev => [...prev, { id, message, type, leaving: false }]);

        // Auto-dismiss
        timers.current[id] = setTimeout(() => dismiss(id), duration);
        return id;
    }, [dismiss]);

    // Convenience shorthands
    toast.success = (message, opts) => toast({ message, type: 'success', ...opts });
    toast.error   = (message, opts) => toast({ message, type: 'error',   duration: 5000, ...opts });
    toast.info    = (message, opts) => toast({ message, type: 'info',    ...opts });
    toast.warning = (message, opts) => toast({ message, type: 'warning', ...opts });

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
}

// ─── Visual Layer ─────────────────────────────────────────────────────────────

const STYLES = {
    success: {
        bar:  'bg-emerald-500',
        icon: 'check_circle',
        iconColor: 'text-emerald-500',
        bg: 'bg-white border-emerald-200',
        title: 'text-emerald-700',
    },
    error: {
        bar:  'bg-red-500',
        icon: 'error',
        iconColor: 'text-red-500',
        bg: 'bg-white border-red-200',
        title: 'text-red-700',
    },
    info: {
        bar:  'bg-blue-500',
        icon: 'info',
        iconColor: 'text-blue-500',
        bg: 'bg-white border-blue-200',
        title: 'text-blue-700',
    },
    warning: {
        bar:  'bg-amber-400',
        icon: 'warning',
        iconColor: 'text-amber-500',
        bg: 'bg-white border-amber-200',
        title: 'text-amber-700',
    },
};

function ToastContainer({ toasts, onDismiss }) {
    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none print:hidden"
            aria-live="polite"
            aria-label="Notifications"
        >
            {toasts.map(t => (
                <Toast key={t.id} toast={t} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

function Toast({ toast, onDismiss }) {
    const s = STYLES[toast.type] || STYLES.success;

    return (
        <div
            className={`
                pointer-events-auto relative overflow-hidden
                flex items-start gap-3 w-80 max-w-[90vw]
                rounded-xl border shadow-xl shadow-slate-200/80
                pr-4 pl-1 py-3
                ${s.bg}
                ${toast.leaving
                    ? 'animate-[slideOutRight_0.3s_ease-in_forwards]'
                    : 'animate-[slideInRight_0.3s_ease-out_forwards]'
                }
            `}
            role="alert"
        >
            {/* Colored left bar */}
            <div className={`w-1 self-stretch rounded-full shrink-0 ${s.bar}`} />

            {/* Icon */}
            <span className={`material-icons-round text-xl shrink-0 mt-0.5 ${s.iconColor}`}>
                {s.icon}
            </span>

            {/* Message */}
            <p className={`flex-1 text-sm font-semibold leading-snug ${s.title}`}>
                {toast.message}
            </p>

            {/* Close button */}
            <button
                onClick={() => onDismiss(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 mt-0.5"
                aria-label="Dismiss"
            >
                <span className="material-icons-round text-lg">close</span>
            </button>

            {/* Progress bar */}
            <div
                className={`absolute bottom-0 left-0 h-[3px] ${s.bar} opacity-40 rounded-b-xl`}
                style={{ animation: `shrinkWidth ${toast.duration ?? 3500}ms linear forwards` }}
            />
        </div>
    );
}
