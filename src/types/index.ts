export interface Participant {
    id: string;
    name: string;
    imageUrl: string;
}

export interface Match {
    id: string;
    round: number; // e.g. 1 for Top 16, 2 for Quarter-finals
    participant1: Participant | null;
    participant2: Participant | null;
    votes1: number;
    votes2: number;
    status: "pending" | "active" | "completed";
    endTime: number | null; // Timestamp for countdown
    winnerId?: string | null;
}

export interface TournamentNode {
    match: Match;
    nextMatchId?: string | null;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    roles: ("admin" | "user")[];
}
