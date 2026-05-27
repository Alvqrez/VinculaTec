import React from "react";
import { View } from "react-native";

export default function Row({
  children,
  style,
  align = "center",
  justify = "flex-start",
  wrap = "nowrap",
}) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
