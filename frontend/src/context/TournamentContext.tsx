import React, { createContext, useContext, useState, useEffect } from "react";
import type { Match, Participant, User } from "../types";

interface TournamentContextType {
    matches: Match[];
    currentUser: User | null;
    addMatch: (match: Match) => void;
    updateMatch: (id: string, match: Partial<Match>) => void;
    deleteMatch: (id: string) => void;
    vote: (matchId: string, participantIndex: 1 | 2) => void;
    loginWithGoogle: () => void;
    logout: () => void;
}

const defaultMatches: Match[] = [
    {
        id: "m1",
        round: 1,
        participant1: {
            id: "p1",
            name: "Option 1",
            imageUrl: "https://via.placeholder.com/300",
        },
        participant2: {
            id: "p2",
            name: "Option 2",
            imageUrl: "https://via.placeholder.com/300",
        },
        votes1: 0,
        votes2: 0,
        status: "active",
        endTime: Date.now() + 600000,
    },
];

const TournamentContext = createContext<TournamentContextType | undefined>(
    undefined,
);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [matches, setMatches] = useState<Match[]>(() => {
        const saved = localStorage.getItem("tournament_matches");
        return saved ? JSON.parse(saved) : defaultMatches;
    });

    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const saved = localStorage.getItem("tournament_user");
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        localStorage.setItem("tournament_matches", JSON.stringify(matches));
    }, [matches]);

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(
                "tournament_user",
                JSON.stringify(currentUser),
            );
        } else {
            localStorage.removeItem("tournament_user");
        }
    }, [currentUser]);

    const addMatch = (match: Match) => {
        setMatches([...matches, match]);
    };

    const updateMatch = (id: string, matchUpdate: Partial<Match>) => {
        setMatches(
            matches.map((m) => (m.id === id ? { ...m, ...matchUpdate } : m)),
        );
    };

    const deleteMatch = (id: string) => {
        setMatches(matches.filter(m => m.id !== id));
    };

    const vote = (matchId: string, optionIndex: 1 | 2) => {
        if (!currentUser) return alert("Please login to vote");

        setMatches(
            matches.map((m) => {
                if (m.id === matchId && m.status === "active") {
                    const votes1 = optionIndex === 1 ? m.votes1 + 1 : m.votes1;
                    const votes2 = optionIndex === 2 ? m.votes2 + 1 : m.votes2;
                    return { ...m, votes1, votes2 };
                }
                return m;
            }),
        );
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
