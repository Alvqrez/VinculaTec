import React from "react";
import { View } from "react-native";
import { useResponsive } from "../hooks/useResponsive";

export default function ResponsiveContainer({ children }) {
    const { isMobile, spacing } = useResponsive();

eturn (
    <View
        style={{
        width: "100%",
        paddingHorizontal: spacing,
        paddingTop: isMobile ? 12 : 24,
        paddingBottom: isMobile ? 90 : 24,
        }}
    >
        {children}
    </View>
    );
}