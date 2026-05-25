import React, { useState, useEffect } from "react";

export const Countdown: React.FC<{ endTime: number | null }> = ({
    endTime,
}) => {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        if (!endTime) return;

        const interval = setInterval(() => {
            const remaining = Math.max(0, endTime - Date.now());
            setTimeLeft(remaining);
            if (remaining === 0) clearInterval(interval);
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime]);

    if (!endTime) return null;

    const m = Math.floor(timeLeft / 60000);
    const s = Math.floor((timeLeft % 60000) / 1000);

    return (
        <div className="text-3xl font-bold font-mono bg-yellow-900/40 text-yellow-500 px-6 py-2 rounded-lg border border-yellow-700/50">
            {m.toString().padStart(2, "0")}:{s.toString().padStart(2, "0")}
        </div>
    );
};
