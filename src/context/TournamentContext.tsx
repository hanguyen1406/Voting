import React, { createContext, useContext, useState, useEffect } from "react";
import type { Match, User } from "../types";

interface TournamentContextType {
    matches: Match[];
    currentUser: User | null;
    addMatch: (match: Match) => Promise<void>;
    updateMatch: (id: string, match: Partial<Match>) => Promise<void>;
    deleteMatch: (id: string) => Promise<void>;
    deleteRound: (round: number) => Promise<void>;
    restartRound: (round: number, duration: number) => Promise<void>;
    vote: (matchId: string, participantIndex: 1 | 2) => Promise<void>;
    loginWithGoogle: () => void;
    logout: () => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(
    undefined,
);

const API_BASE_URL = "/api";

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [matches, setMatches] = useState<Match[]>([]);

    const [currentUser, setCurrentUser] = useState<User | null>({
        id: "admin",
        name: "Admin",
        email: "admin@example.com",
        avatar: "",
        roles: ["admin"]
    });

    const fetchMatches = async () => {
        try {
            const url = `${API_BASE_URL}/matches`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setMatches(data);
                }
            }
        } catch (e) {
            console.error("Error fetching matches from database:", e);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, []);

    const addMatch = async (match: Match) => {
        try {
            const res = await fetch(`${API_BASE_URL}/matches`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(match),
            });
            if (res.ok) {
                await fetchMatches();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const updateMatch = async (id: string, matchUpdate: Partial<Match>) => {
        try {
            const res = await fetch(`${API_BASE_URL}/matches/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(matchUpdate),
            });
            if (res.ok) {
                await fetchMatches();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const deleteMatch = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/matches/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                await fetchMatches();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const deleteRound = async (round: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/rounds/${round}`, {
                method: "DELETE",
            });
            if (res.ok) {
                await fetchMatches();
            } else {
                const err = await res.json();
                alert(err.error || "Không thể xoá vòng đấu.");
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi kết nối khi xoá vòng đấu.");
        }
    };

    const restartRound = async (round: number, duration: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/rounds/${round}/restart`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ duration }),
            });
            if (res.ok) {
                await fetchMatches();
            }
        } catch (e) {
            console.error(e);
        }
    };


    const vote = async (matchId: string, optionIndex: 1 | 2) => {
        if (!currentUser) return alert("Please login to vote");
        try {
            const res = await fetch(`${API_BASE_URL}/matches/${matchId}/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: currentUser.id,
                    optionIndex,
                }),
            });
            if (res.ok) {
                await fetchMatches();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to vote");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loginWithGoogle = () => {
        // Mock Google Login
        setCurrentUser({
            id: "u" + Math.random(),
            name: "Test User",
            email: "user@example.com",
            avatar: "https://via.placeholder.com/40",
            roles: ["user", "admin"],
        });
    };

    const logout = () => setCurrentUser(null);

    return (
        <TournamentContext.Provider
            value={{
                matches,
                currentUser,
                addMatch,
                updateMatch,
                deleteMatch,
                deleteRound,
                restartRound,
                vote,
                loginWithGoogle,
                logout,
            }}
        >
            {children}
        </TournamentContext.Provider>
    );
};

export const useTournament = () => {
    const context = useContext(TournamentContext);
    if (context === undefined) {
        throw new Error(
            "useTournament must be used within a TournamentProvider",
        );
    }
    return context;
};
