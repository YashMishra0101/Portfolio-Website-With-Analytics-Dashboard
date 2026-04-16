import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Check if user has already dismissed it this session
            const isDismissed = sessionStorage.getItem("pwa-prompt-dismissed");
            if (!isDismissed) {
                setIsVisible(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handler);

        // If the app is already installed, don't show the prompt
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem("pwa-prompt-dismissed", "true");
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[9999] animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-4 flex items-center gap-4">
                {/* App Icon Preview */}
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <Download className="text-accent" size={24} />
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-txt text-sm font-bold truncate">Install App</h3>
                    <p className="text-sub text-[11px] leading-tight">Add to your home screen for a better experience and offline access.</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleInstall}
                        className="bg-accent hover:opacity-90 text-white dark:text-zinc-950 text-xs font-bold px-3 py-2 rounded-lg transition-all"
                    >
                        Install
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="text-zinc-500 hover:text-zinc-300 p-1 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
