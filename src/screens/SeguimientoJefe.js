import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Row, Card, Badge, StatCard } from "../components";
import { useProyectos } from "../context/ProyectosContext";

export default function SeguimientoJefe() {
  const { colors: C } = useTheme();
  const STATUS_STYLE = {
  "Aceptado":     { color: C.green, bg: C.greenLight,  icon: "check-circle"  },
  "Pendiente":    { color: C.amber, bg: C.amberLight,  icon: "clock"         },
  "Por corregir": { color: C.red,   bg: C.redLight,    icon: "alert-circle"  },
};
  const { proyectos } = useProyectos() || { proyectos: [] };

  const [busqueda,   setBusqueda]   = useState("");
  const [filtroTipo, setFiltroTipo] = useState("residente");
  const [expandido,  setExpandido]  = useState(null);

  // ── Transformar ProyectosContext en vista por residente ─────────────────
  const residentes = useMemo(() => {
    const result = [];
    proyectos.forEach((proyecto) => {
      proyecto.residentes.forEach((res) => {
        const resReportes = proyecto.reportes
          .filter((r) => r.residente === res.nombre)
          .map((r) => ({
            tipo:   r.fase,
            estado: r.status,
            fecha:  r.fecha || null,
          }));

        result.push({
          id:       `${proyecto.id}_${res.nombre}`,
          nombre:   res.nombre,
          iniciales: res.iniciales,
          empresa:  proyecto.company,
          proyecto: proyecto.title,
          asesor:   proyecto.asesor,
          reportes: resReportes,
        });
      });
    });
    return result;
  }, [proyectos]);

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const residentesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return residentes;
    if (filtroTipo === "residente") return residentes.filter((r) => r.nombre.toLowerCase().includes(q));
    if (filtroTipo === "proyecto")  return residentes.filter((r) => r.proyecto.toLowerCase().includes(q));
    if (filtroTipo === "empresa")   return residentes.filter((r) => r.empresa.toLowerCase().includes(q));
    return residentes;
  }, [busqueda, filtroTipo, residentes]);

  // ── Stats globales ────────────────────────────────────────────────────────
  const allReportes    = residentes.flatMap((r) => r.reportes);
  const totalAceptados   = allReportes.filter((r) => r.estado === "Aceptado").length;
  const totalPendientes  = allReportes.filter((r) => r.estado === "Pendiente").length;
  const totalPorCorregir = allReportes.filter((r) => r.estado === "Por corregir").length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 24 }}>
      {/* ── Header ── */}
      <View style={{ marginBottom: 22 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: C.text }}>Seguimiento del Departamento</Text>
        <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
          Seguimiento de todos los residentes — Departamento de Sistemas
        </Text>
      </View>

      {/* ── Stats ── */}
      <Row style={{ gap: 12, marginBottom: 22 }}>
        <StatCard label="Residentes"       value={String(residentes.length)}    icon="users"        iconBg={C.tealLight}  iconColor={C.teal}  />
        <StatCard label="Reportes Totales" value={String(allReportes.length)}   icon="file-text"    iconBg={C.blueLight}  iconColor={C.blue}  />
        <StatCard label="Aceptados"        value={String(totalAceptados)}       icon="check-circle" iconBg={C.greenLight} iconColor={C.green} />
        <StatCard label="Por Corregir"     value={String(totalPorCorregir)}     icon="alert-circle" iconBg={C.redLight}   iconColor={C.red}   />
      </Row>

      {/* ── Filtros ── */}
      <View style={{ marginBottom: 18 }}>
        <Row style={{ gap: 8, marginBottom: 12 }}>
          {[
            { id: "residente", label: "Por Residente", icon: "user"      },
            { id: "proyecto",  label: "Por Proyecto",  icon: "folder"    },
            { id: "empresa",   label: "Por Empresa",   icon: "briefcase" },
          ].map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => { setFiltroTipo(f.id); setBusqueda(""); }}
              style={{
                flexDirection: "row", alignItems: "center", gap: 6,
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                backgroundColor: filtroTipo === f.id ? C.teal : C.card,
                borderWidth: 1, borderColor: filtroTipo === f.id ? C.teal : C.border,
              }}
            >
              <Feather name={f.icon} size={12} color={filtroTipo === f.id ? "white" : C.textMuted} />
              <Text style={{ fontSize: 12, fontWeight: "700", color: filtroTipo === f.id ? "white" : C.textMuted }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Row>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14 }}>
          <Feather name="search" size={15} color={C.textMuted} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder={
              filtroTipo === "residente" ? "Buscar por nombre del residente..." :
              filtroTipo === "proyecto"  ? "Buscar por nombre del proyecto..." :
              "Buscar por empresa..."
            }
            placeholderTextColor={C.textLight}
            style={{ flex: 1, paddingVertical: 12, fontSize: 13, color: C.text, outlineStyle: "none" }}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda("")}>
              <Feather name="x" size={14} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Conteo de resultados ── */}
      <Text style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>
        {residentesFiltrados.length === residentes.length
          ? `Mostrando todos los residentes (${residentes.length})`
          : `${residentesFiltrados.length} resultado(s) encontrado(s)`}
      </Text>

      {/* ── Pendientes destacados ── */}
      {totalPendientes > 0 && !busqueda && (
        <View style={{ backgroundColor: C.amberLight, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: C.amber }}>
          <Row style={{ alignItems: "center", gap: 8 }}>
            <Feather name="clock" size={16} color={C.amber} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: C.text }}>
              {totalPendientes} reporte{totalPendientes !== 1 ? "s" : ""} pendiente{totalPendientes !== 1 ? "s" : ""} de revisión por asesores
            </Text>
          </Row>
        </View>
      )}

      {/* ── Cards de residentes ── */}
      <View style={{ gap: 14 }}>
        {residentesFiltrados.map((res) => {
          const aceptados   = res.reportes.filter((r) => r.estado === "Aceptado").length;
          const porCorregir = res.reportes.filter((r) => r.estado === "Por corregir").length;
          const pendientes  = res.reportes.filter((r) => r.estado === "Pendiente").length;
          const isOpen      = expandido === res.id;
          const pct         = res.reportes.length > 0
            ? Math.round((aceptados / res.reportes.length) * 100)
            : 0;

          return (
            <Card key={res.id} style={{ padding: 0, overflow: "hidden" }}>
              <TouchableOpacity
                onPress={() => setExpandido(isOpen ? null : res.id)}
                activeOpacity={0.9}
                style={{ padding: 18 }}
              >
                <Row style={{ alignItems: "center", gap: 14 }}>
                  {/* Avatar */}
                  <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.tealLight, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: C.teal }}>{res.iniciales}</Text>
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Row style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>{res.nombre}</Text>
                      <Row style={{ gap: 6 }}>
                        {porCorregir > 0 && (
                          <Badge text={`${porCorregir} por corregir`} color={C.red} bg={C.redLight} />
                        )}
                        {pendientes > 0 && (
                          <Badge text={`${pendientes} en revisión`} color={C.amber} bg={C.amberLight} />
                        )}
                      </Row>
                    </Row>
                    <Text style={{ fontSize: 12, color: C.textMuted }}>{res.proyecto}</Text>
                    <Row style={{ gap: 12, marginTop: 4 }}>
                      <Row style={{ gap: 4, alignItems: "center" }}>
                        <Feather name="briefcase"  size={11} color={C.textLight} />
                        <Text style={{ fontSize: 11, color: C.textMuted }}>{res.empresa}</Text>
                      </Row>
                      <Row style={{ gap: 4, alignItems: "center" }}>
                        <Feather name="user-check" size={11} color={C.textLight} />
                        <Text style={{ fontSize: 11, color: C.textMuted }}>{res.asesor}</Text>
                      </Row>
                    </Row>

                    {/* Barra de progreso */}
                    {res.reportes.length > 0 && (
                      <View style={{ marginTop: 10 }}>
                        <Row style={{ justifyContent: "space-between", marginBottom: 4 }}>
                          <Text style={{ fontSize: 10, color: C.textMuted }}>{aceptados}/{res.reportes.length} reportes aceptados</Text>
                          <Text style={{ fontSize: 10, fontWeight: "700", color: C.teal }}>{pct}%</Text>
                        </Row>
                        <View style={{ height: 6, borderRadius: 3, backgroundColor: C.border }}>
                          <View style={{ height: 6, borderRadius: 3, backgroundColor: pct === 100 ? C.green : C.teal, width: `${pct}%` }} />
                        </View>
                      </View>
                    )}
                  </View>

                  <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={C.textMuted} />
                </Row>
              </TouchableOpacity>

              {/* ── Detalle expandido ── */}
              {isOpen && (
                <View style={{ paddingHorizontal: 18, paddingBottom: 18, borderTopWidth: 1, borderTopColor: C.borderLight, paddingTop: 14 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                    Estado de Reportes
                  </Text>
                  {res.reportes.length === 0 ? (
                    <Text style={{ fontSize: 13, color: C.textLight, fontStyle: "italic" }}>Sin reportes entregados aún.</Text>
                  ) : (
                    <View style={{ gap: 8 }}>
                      {res.reportes.map((rep, ri) => {
                        const st = STATUS_STYLE[rep.estado] || STATUS_STYLE["Pendiente"];
                        return (
                          <Row key={ri} style={{ alignItems: "center", gap: 12, backgroundColor: C.bg, borderRadius: 8, padding: 10 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: st.bg, alignItems: "center", justifyContent: "center" }}>
                              <Feather name={st.icon} size={14} color={st.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, fontWeight: "600", color: C.text }}>{rep.tipo}</Text>
                              {rep.fecha
                                ? <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>Enviado: {rep.fecha}</Text>
                                : <Text style={{ fontSize: 11, color: C.textLight, marginTop: 1, fontStyle: "italic" }}>Sin entregar</Text>
                              }
                            </View>
                            <Badge text={rep.estado} color={st.color} bg={st.bg} />
                          </Row>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
            </Card>
          );
        })}
      </View>

      {/* ── Sin resultados ── */}
      {residentesFiltrados.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 48 }}>
          <Feather name="search" size={32} color={C.textLight} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.textMuted }}>Sin resultados</Text>
          <Text style={{ fontSize: 13, color: C.textLight, marginTop: 4 }}>Intenta con otro término de búsqueda</Text>
        </View>
      )}
    </ScrollView>
  );
}
