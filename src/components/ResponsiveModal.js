import React from "react";
    import {
        Modal,
        View,
        Pressable,
        ScrollView,
        KeyboardAvoidingView,
        Platform,
    } from "react-native";

import { useResponsive } from "../mobile/hooks/useResponsive";
import { useTheme } from "../context/ThemeContext";

export default function ResponsiveModal({
    visible,
    onClose,
    children,
}) {
    const { colors: C } = useTheme();
    const { modalWidth, isMobile } = useResponsive();

    return (
        <Modal visible={visible} transparent animationType="fade">
        <Pressable
            onPress={onClose}
            style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            alignItems: "center",
            padding: isMobile ? 10 : 24,
            }}
        >
            <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
            <Pressable
                onPress={(e) => e.stopPropagation()}
                style={{
                width: modalWidth,
                maxHeight: "90%",
                backgroundColor: C.card,
                borderRadius: 16,
                overflow: "hidden",
                }}
            >
                <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 20 }}
                >
                {children}
                </ScrollView>
            </Pressable>
            </KeyboardAvoidingView>
        </Pressable>
        </Modal>
    );
}