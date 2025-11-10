import { Application } from "express";
import { WebApp } from "../src/app";
import { Pool } from "pg";

declare global {
    var app: Application;
    var webAppInstance: WebApp;
    var db: ReturnType<WebApp["getDb"]>;
    var pool: Pool;

    const validPassword: "Secure123456@";
    const uniqueEmail: (prefix?: string) => string;

    type NewUserOptions = {
        first_name?: string;
        last_name?: string;
        email_prefix?: string;
    };

    const newUser: (options?: NewUserOptions) => {
        first_name: string;
        last_name: string;
        email: string;
        password: string;
    };
}

export {};
