import { View } from "react-native";
import { useTheme } from "../context/ThemeContext";
export default function Card({ children, style }) {
  const { colors: C } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: C.card,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: C.border,
          padding: 20,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
