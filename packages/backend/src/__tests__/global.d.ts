import { Application } from "express";
import { WebApp } from "../app";
import { Pool } from "pg";

declare global {
    var app: Application;
    var webAppInstance: WebApp;
    var db: ReturnType<WebApp["getDb"]>;
    var pool: Pool;
}

export {};
