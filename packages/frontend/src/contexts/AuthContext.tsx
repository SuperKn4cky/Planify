"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { postJSON, delJSON } from "@/lib/api";

interface AuthContextType {
    isAuthenticated: boolean;
    login: () => void;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const router = useRouter();

    const login = () => {
        setIsAuthenticated(true);
        router.push("/dashboard");
    };

    const logout = async () => {
        try {
            await postJSON<{ message: string }>("auth/logout");
        } catch {
        } finally {
            setIsAuthenticated(false);
            router.push("/auth/login");
            router.refresh();
        }
    };

    const deleteAccount = async () => {
        try {
            await delJSON<{ message: string }>("api/users/me");
        } finally {
            setIsAuthenticated(false);
            router.push("auth/register");
            router.refresh();
        }
    };

    return (
        <AuthContext.Provider
            value={{ isAuthenticated, login, logout, deleteAccount }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context)
        throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
