"use client";

import {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { postJSON, delJSON, getJSON } from "@/lib/api";
import { ApiError } from "@/lib/api";

interface AuthContextType {
    isAuthenticated: boolean;
    login: () => void;
    logout: () => Promise<void>;
    logoutAll: () => Promise<void>;
    deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                await getJSON("/api/users/me");
                if (!cancelled) setIsAuthenticated(true);
            } catch {
                if (!cancelled) setIsAuthenticated(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const login = () => {
        setIsAuthenticated(true);
        router.push("/dashboard");
    };

    const logout = async () => {
        try {
            await postJSON<{ message: string }>("auth/logout");
            setIsAuthenticated(false);
            router.push("/auth/login");
            router.refresh();
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new Error("Erreur de déconnexion");
        }
    };

    const logoutAll = async () => {
        try {
            await postJSON<{ message: string }>("auth/logout-all");
            setIsAuthenticated(false);
            router.push("/auth/login");
            router.refresh();
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new Error("Erreur de déconnexion des sessions");
        }
    };

    const deleteAccount = async () => {
        try {
            await delJSON<{ message: string }>("/api/users/me");
            setIsAuthenticated(false);
            router.push("/auth/login");
            router.refresh();
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new Error("Erreur de suppression du compte");
        }
    };

    return (
        <AuthContext.Provider
            value={{ isAuthenticated, login, logout, logoutAll, deleteAccount }}
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
