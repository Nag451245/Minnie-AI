import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions, Keyboard } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows, Typography, Spacing, BorderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const insets = useSafeAreaInsets();
    const [visible, setVisible] = React.useState(true);

    React.useEffect(() => {
        const showSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => {
            setVisible(false);
        });
        const hideSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
            setVisible(true);
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    if (!visible) return null;

    // Dynamic height based on safe area
    const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 60 + insets.bottom : 70;
    const PADDING_BOTTOM = Platform.OS === 'ios' ? insets.bottom - 10 : 10;

    return (
        <View style={[styles.container, { height: TAB_BAR_HEIGHT, paddingBottom: Math.max(PADDING_BOTTOM, 10) }]}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label =
                    options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;

                const isFocused = state.index === index;
                const isLogButton = route.name === 'Log';

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                // Render the floating "Log" button specially
                if (isLogButton) {
                    return (
                        <View key={route.key} style={styles.logButtonWrapper} pointerEvents="box-none">
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                accessibilityLabel={options.tabBarAccessibilityLabel || "Log Activity"}
                                testID={options.tabBarTestID}
                                onPress={onPress}
                                onLongPress={onLongPress}
                                style={styles.logButtonErrorCorrection}
                                activeOpacity={0.9}
                            >
                                <View style={styles.logButtonInner}>
                                    <Text style={styles.logButtonIcon}>+</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    );
                }

                // Render standard tab strings/icons
                // Logic to get icon from options or default
                // In TabNavigator we passed a function for tabBarIcon, we need to call it if it exists.
                // However, CustomTabBar usually renders its own icons or uses the one from options.
                // In the existing TabNavigator, `tabBarIcon` is defined in `options`.

                // We'll define a simple map here for cleaner code or extract from options
                let iconText = '';
                if (route.name === 'Home') iconText = '🏠';
                else if (route.name === 'Activity') iconText = '👟';
                else if (route.name === 'Coach') iconText = '💬';
                else if (route.name === 'Progress') iconText = '📊';
                else if (route.name === 'Settings') iconText = '⚙️';

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={styles.tabItem}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabIcon, isFocused && styles.tabIconFocused]}>
                            {iconText}
                        </Text>
                        <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>
                            {label as string}
                        </Text>
                        {isFocused && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        ...Shadows.lg,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        elevation: 8,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 8,
    },
    tabIcon: {
        fontSize: 24,
        marginBottom: 4,
        opacity: 0.5,
    },
    tabIconFocused: {
        opacity: 1,
        transform: [{ scale: 1.1 }],
    },
    tabLabel: {
        fontSize: 10,
        color: Colors.textTertiary,
        fontWeight: '500',
    },
    tabLabelFocused: {
        color: Colors.primary,
        fontWeight: '700',
    },
    activeIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
        marginTop: 4,
    },
    logButtonWrapper: {
        width: 70, // Fixed width for the center button area
        height: '100%',
        justifyContent: 'flex-start', // Align to top of tab bar to allow overflow
        alignItems: 'center',
        zIndex: 10,
        marginTop: -30, // Pull it up
    },
    logButtonErrorCorrection: {
        // This wrapper ensures the hit slop and layout are stable
        alignItems: 'center',
        justifyContent: 'center',
    },
    logButtonInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.xl,
        borderWidth: 4,
        borderColor: Colors.background,
    },
    logButtonIcon: {
        fontSize: 32,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginTop: -2,
    },
});

export default CustomTabBar;
