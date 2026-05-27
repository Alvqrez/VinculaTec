import React from "react";
import { View } from "react-native";
import { useResponsive } from "../mobile/hooks/useResponsive";

export default function ResponsiveGrid({ children }) {
    const { isMobile } = useResponsive();

    return (
        <View
        style={{
            flexDirection: isMobile ? "column" : "row",
            flexWrap: "wrap",
            gap: 14,
        }}
        >
        {children}
        </View>
    );
}