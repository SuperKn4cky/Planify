import AppError from "../middlewares/errorHandler.js";

type TaskLock = {
    userId: number;
    lockedAt: number;
};

export class InMemoryTaskLockManager {
    private locks = new Map<number, TaskLock>();
    private ttlMs = 5 * 60 * 1000;

    private isExpired(lock: TaskLock): boolean {
        return Date.now() - lock.lockedAt > this.ttlMs;
    }

    public acquire(taskId: number, userId: number): void {
        const current = this.locks.get(taskId);

        if (current && !this.isExpired(current) && current.userId !== userId) {
            throw new AppError("Task is currently being edited", 409);
        }

        this.locks.set(taskId, { userId, lockedAt: Date.now() });
    }

    public release(taskId: number, userId: number): void {
        const current = this.locks.get(taskId);
        if (current && current.userId === userId) {
            this.locks.delete(taskId);
        }
    }

    public getStatus(
        taskId: number,
        userId: number,
    ): {
        isLocked: boolean;
        lockedByMe: boolean;
    } {
        const current = this.locks.get(taskId);
        if (!current) {
            return { isLocked: false, lockedByMe: false };
        }

        if (this.isExpired(current)) {
            this.locks.delete(taskId);
            return { isLocked: false, lockedByMe: false };
        }

        return {
            isLocked: current.userId !== userId,
            lockedByMe: current.userId === userId,
        };
    }
}
