"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [health, setHealth] = useState<null | "OK" | "FAIL">(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "OK") setHealth("OK");
        else setHealth("FAIL");
      })
      .catch(() => setHealth("FAIL"));
  }, []);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="mt-8">
          <span
            className={
              "font-mono text-lg " +
              (health === "OK"
                ? "text-green-500"
                : health === "FAIL"
                  ? "text-red-500"
                  : "text-gray-500")
            }
          >
            {health === null
              ? "Checking health..."
              : health === "OK"
                ? "Backend status: OK"
                : "Backend status: FAIL"}
          </span>
        </div>
      </main>
    </div>
  );
}
