import { DailyLog } from '../types';

class StatsService {
    /**
     * Calculate current streak based on history logs
     * A streak is defined as consecutive days where the step goal was met.
     */
    calculateCurrentStreak(logs: DailyLog[]): number {
        if (!logs || logs.length === 0) return 0;

        // Sort logs by date descending (newest first)
        const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Check today / yesterday to start streak
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        let streak = 0;
        let currentDateToCheck = today;

        // Use a map for O(1) lookup
        const logMap = new Map(sortedLogs.map(l => [l.date, l]));

        // If today has a log and goal met, start counting. 
        // If today not logged yet, check yesterday.
        if (logMap.has(today)) {
            const todayLog = logMap.get(today);
            if (todayLog && todayLog.steps >= (todayLog.stepGoal || 7000)) {
                streak++;
                currentDateToCheck = yesterday;
            } else {
                // Today not met yet. Check if streak is alive from yesterday.
                currentDateToCheck = yesterday;
            }
        } else {
            currentDateToCheck = yesterday; // Start check from yesterday
        }

        while (true) {
            if (logMap.has(currentDateToCheck)) {
                const log = logMap.get(currentDateToCheck);
                if (log && log.steps >= (log.stepGoal || 7000)) {
                    streak++;
                    // Move back one day
                    const d = new Date(currentDateToCheck);
                    d.setDate(d.getDate() - 1);
                    currentDateToCheck = d.toISOString().split('T')[0];
                } else {
                    break; // Streak broken
                }
            } else {
                break; // No log found, streak ends
            }
        }

        return streak;
    }

    /**
     * Get weekly completion status (Mon-Sun or last 7 days)
     */
    getWeeklyCompletion(logs: DailyLog[]): boolean[] {
        // Return array of booleans for last 7 days indicating goal met
        const result = [];
        const logMap = new Map(logs.map(l => [l.date, l]));

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const log = logMap.get(dateStr);
            result.push(log ? log.steps >= (log.stepGoal || 7000) : false);
        }
        return result;
    }

    /**
     * Get aggregate stats for a date range
     */
    getStats(logs: DailyLog[]) {
        if (!logs.length) return { totalSteps: 0, avgSteps: 0, bestDay: 0 };

        const totalSteps = logs.reduce((sum, log) => sum + (log.steps || 0), 0);
        const avgSteps = Math.round(totalSteps / logs.length);
        const bestDay = Math.max(...logs.map(l => l.steps || 0));

        return { totalSteps, avgSteps, bestDay };
    }
}

export default new StatsService();
