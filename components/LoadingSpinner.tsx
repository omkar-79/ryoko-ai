
import React from 'react';

const LoadingSpinner: React.FC = () => {
    const messages = [
        "Consulting global maps...",
        "Finding hidden gems...",
        "Aligning with your group's vibe...",
        "Cross-referencing your must-do list...",
        "Crafting the perfect day...",
        "Finalizing your adventure...",
    ];
    const [message, setMessage] = React.useState(messages[0]);

    React.useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % messages.length;
            setMessage(messages[index]);
        }, 2500);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-10 bg-slate-700 rounded-lg shadow-xl text-white">
            <svg className="animate-spin h-12 w-12 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none"
                 viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg font-semibold transition-opacity duration-500">{message}</p>
        </div>
    );
};

export default LoadingSpinner;
