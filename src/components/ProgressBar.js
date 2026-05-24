import { View } from "react-native";
import { useTheme } from "../context/ThemeContext";
export default function ProgressBar({ pct, color }) {
  const { colors: C } = useTheme();
  return (
    <View style={{ height: 6, backgroundColor: C.bg, borderRadius: 3, overflow: "hidden", flex: 1 }}>
      <View style={{ height: "100%", width: `${pct}%`, backgroundColor: color || C.teal, borderRadius: 3 }} />
    </View>
  );
}
