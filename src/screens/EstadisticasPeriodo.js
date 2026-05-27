import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import apiClient from "../utils/apiClient";

export default function EstadisticasPeriodo() {
  const { colors: C } = useTheme();
  const styles = getStyles(C);
  const [loading, setLoading] = useState(true);
  const [periodos, setPeriodos] = useState([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [empresasPeriodo, setEmpresasPeriodo] = useState([]);
  const [alumnosPorProyecto, setAlumnosPorProyecto] = useState([]);
  const [cumplimiento, setCumplimiento] = useState([]);
  const [mostrarCumplimiento, setMostrarCumplimiento] = useState(false);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async (periodo = null) => {
    try {
      setLoading(true);
      const endpoint = periodo
        ? `/api/jefe/estadisticas-por-periodo?periodo=${encodeURIComponent(periodo)}`
        : "/api/jefe/estadisticas-por-periodo";

      const res = await apiClient.get(endpoint);
      if (res.ok && res.body?.ok) {
        setPeriodos(res.body.periodos);
        setPeriodoSeleccionado(res.body.periodoSeleccionado);
        setEstadisticas(res.body.estadisticas);
        setEmpresasPeriodo(res.body.empresasPeriodo);
        setAlumnosPorProyecto(res.body.alumnosPorProyecto);
      }
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    } finally {
      setLoading(false);
    }
  };

  const cargarCumplimiento = async () => {
    try {
      setLoading(true);
      const endpoint = periodoSeleccionado
        ? `/api/jefe/porcentaje-cumplimiento?periodo=${encodeURIComponent(periodoSeleccionado)}`
        : "/api/jefe/porcentaje-cumplimiento";

      const res = await apiClient.get(endpoint);
      if (res.ok && res.body?.ok) {
        setCumplimiento(res.body.cumplimiento);
        setMostrarCumplimiento(true);
      }
    } catch (err) {
      console.error("Error al cargar cumplimiento:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Estadísticas por Periodo</Text>

      {/* Selector de periodo */}
      <View style={styles.periodSelector}>
        <Text style={styles.label}>Periodo:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {periodos.map((p) => (
            <TouchableOpacity
              key={p.periodo}
              style={[
                styles.periodButton,
                periodoSeleccionado === p.periodo && styles.periodButtonActive,
              ]}
              onPress={() => cargarEstadisticas(p.periodo)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  periodoSeleccionado === p.periodo &&
                    styles.periodButtonTextActive,
                ]}
              >
                {p.periodo}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {estadisticas && (
        <>
          {/* Estadísticas generales */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {estadisticas.totalResidentes}
              </Text>
              <Text style={styles.statLabel}>Residentes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{estadisticas.totalEmpresas}</Text>
              <Text style={styles.statLabel}>Empresas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {estadisticas.proyectosActivos}
              </Text>
              <Text style={styles.statLabel}>Proyectos Activos</Text>
            </View>
          </View>

          {/* Empresas por periodo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Empresas en este periodo</Text>
            {empresasPeriodo.length === 0 ? (
              <Text style={styles.noData}>Sin empresas para este periodo.</Text>
            ) : (
              empresasPeriodo.map((empresa) => (
                <View key={empresa.id} style={styles.item}>
                  <Text style={styles.itemName}>{empresa.nombre}</Text>
                  <Text style={styles.itemValue}>
                    {empresa.residentes} residentes
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Alumnos por proyecto */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alumnos por proyecto</Text>
            {alumnosPorProyecto.length === 0 ? (
              <Text style={styles.noData}>
                Sin proyectos para este periodo.
              </Text>
            ) : (
              alumnosPorProyecto.map((proyecto) => (
                <View key={proyecto.id} style={styles.item}>
                  <Text style={styles.itemName}>{proyecto.titulo}</Text>
                  <Text style={styles.itemValue}>
                    {proyecto.alumnos} alumnos
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Botón para ver cumplimiento */}
          <TouchableOpacity style={styles.button} onPress={cargarCumplimiento}>
            <Text style={styles.buttonText}>
              Ver Porcentaje de Cumplimiento
            </Text>
          </TouchableOpacity>

          {/* Gráfico de cumplimiento */}
          {mostrarCumplimiento && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Porcentaje de Cumplimiento por Empresa
              </Text>
              {cumplimiento.map((empresa) => (
                <View key={empresa.id} style={styles.cumplimientoItem}>
                  <Text style={styles.cumplimientoName}>{empresa.nombre}</Text>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${empresa.porcentaje_cumplimiento || 0}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.cumplimientoValue}>
                    {empresa.porcentaje_cumplimiento || 0}%
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {!periodos.length && (
        <Text style={styles.noData}>
          No hay periodos registrados. Crea periodos en Administración para ver
          estadísticas.
        </Text>
      )}
    </ScrollView>
  );
}

const getStyles = (C) =>
  StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: C.bg },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: C.bg,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
      color: C.text,
    },
    periodSelector: { marginBottom: 20 },
    label: { fontSize: 16, fontWeight: "600", marginBottom: 10, color: C.text },
    periodButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: C.card,
      marginRight: 8,
      borderWidth: 1,
      borderColor: C.border,
    },
    periodButtonActive: { backgroundColor: C.blue, borderColor: C.blue },
    periodButtonText: { fontSize: 14, color: C.textMuted },
    periodButtonTextActive: { color: "white" },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: C.card,
      padding: 16,
      borderRadius: 8,
      marginHorizontal: 4,
      alignItems: "center",
      borderWidth: 1,
      borderColor: C.border,
    },
    statValue: { fontSize: 24, fontWeight: "bold", color: C.blue },
    statLabel: { fontSize: 12, color: C.textMuted, marginTop: 4 },
    section: { marginBottom: 20 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 12,
      color: C.text,
    },
    item: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 12,
      backgroundColor: C.card,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: C.border,
    },
    itemName: { fontSize: 14, color: C.text, flex: 1 },
    itemValue: { fontSize: 14, fontWeight: "600", color: C.blue },
    button: {
      backgroundColor: C.blue,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 10,
      alignItems: "center",
      marginBottom: 20,
    },
    buttonText: { fontSize: 16, fontWeight: "700", color: "white" },
    cumplimientoItem: { marginBottom: 16 },
    cumplimientoName: {
      fontSize: 14,
      fontWeight: "600",
      color: C.text,
      marginBottom: 8,
    },
    progressBarContainer: {
      height: 12,
      backgroundColor: C.border,
      borderRadius: 6,
      overflow: "hidden",
      marginBottom: 6,
    },
    progressBar: { height: "100%", backgroundColor: C.blue, borderRadius: 6 },
    cumplimientoValue: {
      fontSize: 14,
      fontWeight: "700",
      color: C.blue,
      textAlign: "right",
    },
    noData: {
      fontSize: 14,
      color: C.textMuted,
      textAlign: "center",
      marginTop: 20,
    },
  });
