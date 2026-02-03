/**
 * Notification Service - Handles all app notifications using @notifee
 * Used for sedentary nudges, goal reminders, and achievement celebrations
 */
import notifee, {
    AndroidImportance,
    AndroidStyle,
    AuthorizationStatus,
    TimestampTrigger,
    TriggerType
} from '@notifee/react-native';
import { Platform } from 'react-native';

// Notification channel IDs
const CHANNELS = {
    ACTIVITY_NUDGE: 'activity-nudge',
    GOAL_REMINDER: 'goal-reminder',
    ACHIEVEMENT: 'achievement',
};

// Minnie's nudge messages for variety
const SEDENTARY_MESSAGES = [
    { title: "Time to move! 🚶", body: "You've been sitting for a while. A quick walk can boost your energy!" },
    { title: "Hey there! 👋", body: "Standing up and stretching for 2 minutes works wonders!" },
    { title: "Movement break! 💪", body: "Every step counts! How about a quick lap around the room?" },
    { title: "Minnie here! 🌟", body: "Your body will thank you for a little movement right now!" },
    { title: "Stretch time! 🧘", body: "Been sitting too long? Let's get those muscles moving!" },
];

const GOAL_REMINDER_MESSAGES = [
    { title: "You're so close! 🎯", body: "Just {remaining} more steps to hit your daily goal!" },
    { title: "Almost there! ⭐", body: "A short walk will help you reach {remaining} remaining steps!" },
    { title: "Evening check-in 🌙", body: "Let's finish strong! {remaining} steps to go!" },
];

const ACHIEVEMENT_MESSAGES = [
    { title: "Goal Crushed! 🎉", body: "You hit your step goal! Amazing work today!" },
    { title: "Champion! 🏆", body: "Daily goal achieved! You're on fire!" },
    { title: "Woohoo! 🌟", body: "You did it! Another successful day!" },
];

class NotificationService {
    private initialized = false;

    /**
     * Initialize notification channels (required for Android)
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Create notification channels for Android
            await notifee.createChannel({
                id: CHANNELS.ACTIVITY_NUDGE,
                name: 'Activity Nudges',
                description: 'Reminders to move when sedentary',
                importance: AndroidImportance.DEFAULT,
                sound: 'default',
            });

            await notifee.createChannel({
                id: CHANNELS.GOAL_REMINDER,
                name: 'Goal Reminders',
                description: 'Daily step goal reminders',
                importance: AndroidImportance.DEFAULT,
                sound: 'default',
            });

            await notifee.createChannel({
                id: CHANNELS.ACHIEVEMENT,
                name: 'Achievements',
                description: 'Celebration notifications for goals reached',
                importance: AndroidImportance.HIGH,
                sound: 'default',
            });

            this.initialized = true;
            console.log('NotificationService initialized');
        } catch (error) {
            console.error('Failed to initialize notifications:', error);
        }
    }

    /**
     * Request notification permissions
     */
    async requestPermission(): Promise<boolean> {
        try {
            const settings = await notifee.requestPermission();
            return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    /**
     * Check if notifications are enabled
     */
    async hasPermission(): Promise<boolean> {
        try {
            const settings = await notifee.getNotificationSettings();
            return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
        } catch (error) {
            return false;
        }
    }

    /**
     * Display a sedentary nudge notification
     */
    async showSedentaryNudge(): Promise<void> {
        await this.initialize();

        const message = SEDENTARY_MESSAGES[Math.floor(Math.random() * SEDENTARY_MESSAGES.length)];

        await notifee.displayNotification({
            title: message.title,
            body: message.body,
            android: {
                channelId: CHANNELS.ACTIVITY_NUDGE,
                smallIcon: 'ic_notification', // Uses default if not found
                pressAction: {
                    id: 'default',
                },
            },
        });
    }

    /**
     * Display a goal reminder notification
     */
    async showGoalReminder(remainingSteps: number): Promise<void> {
        await this.initialize();

        const message = GOAL_REMINDER_MESSAGES[Math.floor(Math.random() * GOAL_REMINDER_MESSAGES.length)];

        await notifee.displayNotification({
            title: message.title,
            body: message.body.replace('{remaining}', remainingSteps.toLocaleString()),
            android: {
                channelId: CHANNELS.GOAL_REMINDER,
                smallIcon: 'ic_notification',
                pressAction: {
                    id: 'default',
                },
            },
        });
    }

    /**
     * Display an achievement notification
     */
    async showAchievement(type: 'goal' | 'streak' | 'challenge'): Promise<void> {
        await this.initialize();

        let message = ACHIEVEMENT_MESSAGES[Math.floor(Math.random() * ACHIEVEMENT_MESSAGES.length)];

        if (type === 'streak') {
            message = { title: "Streak Extended! 🔥", body: "You're building an amazing streak! Keep it going!" };
        } else if (type === 'challenge') {
            message = { title: "Challenge Complete! 💪", body: "You crushed today's challenge! Amazing work!" };
        }

        await notifee.displayNotification({
            title: message.title,
            body: message.body,
            android: {
                channelId: CHANNELS.ACHIEVEMENT,
                smallIcon: 'ic_notification',
                importance: AndroidImportance.HIGH,
                pressAction: {
                    id: 'default',
                },
            },
        });
    }

    /**
     * Schedule an evening goal reminder
     */
    async scheduleEveningReminder(remainingSteps: number): Promise<void> {
        await this.initialize();

        // Schedule for 7 PM today (or tomorrow if past 7 PM)
        const now = new Date();
        const reminderTime = new Date();
        reminderTime.setHours(19, 0, 0, 0);

        if (now >= reminderTime) {
            // Already past 7 PM, schedule for tomorrow
            reminderTime.setDate(reminderTime.getDate() + 1);
        }

        const message = GOAL_REMINDER_MESSAGES[0];

        const trigger: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: reminderTime.getTime(),
        };

        await notifee.createTriggerNotification(
            {
                title: message.title,
                body: message.body.replace('{remaining}', remainingSteps.toLocaleString()),
                android: {
                    channelId: CHANNELS.GOAL_REMINDER,
                    smallIcon: 'ic_notification',
                    pressAction: {
                        id: 'default',
                    },
                },
            },
            trigger
        );
    }

    /**
     * Cancel all scheduled notifications
     */
    async cancelAllScheduled(): Promise<void> {
        await notifee.cancelAllNotifications();
    }
}

export default new NotificationService();
