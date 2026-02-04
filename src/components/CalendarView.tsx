import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { DailyLog } from '../types';

const { width } = Dimensions.get('window');

interface CalendarViewProps {
    logs: DailyLog[];
    onSelectDate: (date: string) => void;
    selectedDate?: string;
}

export default function CalendarView({ logs, onSelectDate, selectedDate }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return new Date(year, month + 1, 0).getDate();
    }, [currentDate]);

    const firstDayOfMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return new Date(year, month, 1).getDay(); // 0 = Sunday
    }, [currentDate]);

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getDayStatus = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const log = logs.find(l => l.date === dateStr);
        return {
            hasLog: !!log,
            goalMet: log ? log.steps >= log.stepGoal : false,
            dateStr
        };
    };

    const renderCalendarGrid = () => {
        const grid = [];
        // Empty cells for padding start
        // Adjustment to make Monday start of week if desired, but Sunday is standard JS
        // Let's stick to Sunday start for simplicity or adjust to Monday (usually prefer Monday for fitness)
        // Let's do Monday start: 0->6 (Sun), 1->0 (Mon)... 
        // Sunday (0) becomes 6, Monday (1) becomes 0.
        // let startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        // Standard Sunday start for now
        let startOffset = firstDayOfMonth;

        for (let i = 0; i < startOffset; i++) {
            grid.push(<View key={`pad-${i}`} style={styles.dayCell} />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const { hasLog, goalMet, dateStr } = getDayStatus(day);
            const isSelected = selectedDate === dateStr;

            grid.push(
                <TouchableOpacity
                    key={day}
                    style={[
                        styles.dayCell,
                        isSelected && styles.selectedDay
                    ]}
                    onPress={() => onSelectDate(dateStr)}
                >
                    <View style={[
                        styles.dayCircle,
                        goalMet && styles.goalMetCircle,
                        hasLog && !goalMet && styles.loggedCircle,
                    ]}>
                        <Text style={[
                            styles.dayText,
                            (hasLog || isSelected) && styles.activeDayText
                        ]}>{day}</Text>
                    </View>
                </TouchableOpacity>
            );
        }

        return grid;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
                    <Text style={styles.navText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.monthTitle}>{monthName}</Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                    <Text style={styles.navText}>→</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.weekHeader}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <Text key={day} style={styles.weekDayText}>{day}</Text>
                ))}
            </View>

            <View style={styles.grid}>
                {renderCalendarGrid()}
            </View>

            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.goalMetCircle]} />
                    <Text style={styles.legendText}>Goal Met</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.loggedCircle]} />
                    <Text style={styles.legendText}>Logged</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    monthTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
    },
    navButton: {
        padding: Spacing.sm,
    },
    navText: {
        fontSize: Typography.fontSize.xl,
        color: Colors.primary,
    },
    weekHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    weekDayText: {
        width: (width - 64) / 7,
        textAlign: 'center',
        fontSize: Typography.fontSize.xs,
        color: Colors.textTertiary,
        fontWeight: Typography.fontWeight.bold,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: (width - 64) / 7,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    dayCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedDay: {
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.lg,
    },
    goalMetCircle: {
        backgroundColor: Colors.activity,
    },
    loggedCircle: {
        backgroundColor: Colors.primaryLight,
    },
    dayText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
    },
    activeDayText: {
        color: Colors.textLight,
        fontWeight: Typography.fontWeight.bold,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.lg,
        marginTop: Spacing.md,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: Spacing.xs,
    },
    legendText: {
        fontSize: Typography.fontSize.xs,
        color: Colors.textSecondary,
    },
});
