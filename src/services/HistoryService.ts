import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyLog } from '../types';

const STORAGE_KEY = '@minnie_daily_logs';

class HistoryService {
    /**
     * Save or update a daily log entry safely without overwriting other history
     */
    async saveDailyLog(log: DailyLog): Promise<void> {
        try {
            const history = await this.getAllLogs();
            const index = history.findIndex(l => l.date === log.date);

            if (index >= 0) {
                // Update existing
                history[index] = { ...history[index], ...log };
            } else {
                // Add new
                history.push(log);
            }

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (error) {
            console.error('[HistoryService] Failed to save log:', error);
        }
    }

    /**
     * Get all historical logs
     */
    async getAllLogs(): Promise<DailyLog[]> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('[HistoryService] Failed to get logs:', error);
            return [];
        }
    }

    /**
     * Get logs for a specific date range
     */
    async getLogs(startDate: string, endDate: string): Promise<DailyLog[]> {
        const allLogs = await this.getAllLogs();
        return allLogs.filter(log => log.date >= startDate && log.date <= endDate);
    }

    /**
     * Get the LAST 7 days of logs (including today)
     */
    async getWeeklyLogs(): Promise<DailyLog[]> {
        const allLogs = await this.getAllLogs();
        // Sort by date desc
        allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return allLogs.slice(0, 7);
    }

    /**
     * Get the best steps day ever recorded
     */
    async getBestStepDay(): Promise<DailyLog | null> {
        const allLogs = await this.getAllLogs();
        if (allLogs.length === 0) return null;
        return allLogs.reduce((prev, current) => (prev.steps || 0) > (current.steps || 0) ? prev : current);
    }

    /**
     * Get weight trend (last known weight vs weight 7 days ago)
     */
    async getWeightTrend(): Promise<number | null> {
        const logs = await this.getAllLogs();
        // Sort date asc
        logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const validWeights = logs.filter(l => l.weight && l.weight > 0);
        if (validWeights.length < 2) return null;

        const current = validWeights[validWeights.length - 1].weight!;
        const previous = validWeights[0].weight!; // Simple start vs end for now

        return current - previous;
    }
}

export default new HistoryService();
