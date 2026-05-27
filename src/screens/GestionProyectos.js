import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, Modal, TextInput,
  Pressable, ActivityIndicator, Animated, Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Row, Badge } from "../components";
import apiClient from "../utils/apiClient";
import { useWebSocket } from "../context/WebSocketContext";

const PRIORIDADES = ["Alta", "Media", "Baja"];
const FASES = [
  { id:"desarrollo", label:"En Desarrollo" },
  { id:"revision",   label:"En Revisión"   },
  { id:"concluido",  label:"Concluido"      },
];
const EMPTY_REGISTER_FORM = {
  titulo:"", empresa_id:"", prioridad:"Media", estado:"desarrollo",
  tecnologias:"", descripcion:"", periodo:"",
};

const Field = ({ label, children, C }) => (
  <View style={{ marginBottom:18 }}>
    <Text style={{ fontSize:11, fontWeight:"700", color:C.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:7 }}>{label}</Text>
    {children}
  </View>
);

const getPriorityStyle = (priority, C) =>
  ({ Alta:{color:C.red,bg:C.redLight}, Media:{color:C.amber,bg:C.amberLight}, Baja:{color:C.green,bg:C.greenLight} })[priority]
  || { color:C.amber, bg:C.amberLight };

// ProjectCard fuera del componente padre → referencia estable → sin re-montaje al escribir en modales
const ProjectCard = React.memo(({ card, index, col, active, onPress, onEdit, onAprobarAvance, onAsignar }) => {
  const { colors: C } = useTheme();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:220, delay:index*60, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:220, delay:index*60, useNativeDriver:true }),
    ]).start();
  }, []);

  const ps   = getPriorityStyle(card.priority || "Media", C);
  const tags = card.tags ? card.tags.split(",").map(t=>t.trim()).filter(Boolean) : [];

  return (
    <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>
      <TouchableOpacity
        onPress={onPress} activeOpacity={0.85}
        style={{
          backgroundColor:C.card, borderRadius:11, borderWidth:1,
          borderColor: active ? col.color : C.border, padding:14,
          ...(active ? { shadowColor:col.color, shadowOffset:{width:0,height:2}, shadowOpacity:0.18, shadowRadius:6, elevation:3 } : {}),
        }}
      >
        <Row style={{ justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <Row style={{ gap:6, flex:1 }}>
            <Badge text={card.priority||"Media"} color={ps.color} bg={ps.bg} />
            {card.solicitud_avance ? <Badge text="⬆ Avance" color={C.teal} bg={C.tealLight} /> : null}
          </Row>
          <Row style={{ gap:4 }}>
            <TouchableOpacity onPress={(e)=>{e.stopPropagation();onAsignar(card);}} style={{padding:4}}>
              <Feather name="user-plus" size={13} color={C.textLight} />
            </TouchableOpacity>
            <TouchableOpacity onPress={(e)=>{e.stopPropagation();onEdit(card);}} style={{padding:4}}>
              <Feather name="edit-2" size={13} color={C.textLight} />
            </TouchableOpacity>
          </Row>
        </Row>

        <Text style={{ fontSize:13, fontWeight:"700", color:C.text, marginBottom:10, lineHeight:18 }}>{card.title}</Text>

        {tags.length > 0 && (
          <Row style={{ flexWrap:"wrap", gap:5, marginBottom:12 }}>
            {tags.map((tag,ti) => (
              <View key={ti} style={{ backgroundColor:C.bg, borderRadius:5, paddingHorizontal:7, paddingVertical:2, borderWidth:1, borderColor:C.border }}>
                <Text style={{ fontSize:10, color:C.textMuted, fontWeight:"600" }}>{tag}</Text>
              </View>
            ))}
          </Row>
        )}

        <Row style={{ justifyContent:"space-between", alignItems:"center", marginBottom:card.asesor?8:0 }}>
          <Text style={{ fontSize:10, color:C.textMuted, fontWeight:"600", flex:1 }} numberOfLines={1}>{card.company||"Sin empresa"}</Text>
          {card.residenteIniciales && (
            <View style={{ width:26, height:26, borderRadius:13, backgroundColor:C.teal, alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:9, color:"white", fontWeight:"800" }}>{card.residenteIniciales}</Text>
            </View>
          )}
        </Row>

        {card.asesor ? (
          <Row style={{ alignItems:"center", gap:5, backgroundColor:C.bg, borderRadius:6, paddingHorizontal:8, paddingVertical:5, marginBottom:card.solicitud_avance?8:0 }}>
            <Feather name="user-check" size={11} color={C.teal} />
            <Text style={{ fontSize:11, color:C.teal, fontWeight:"600" }}>{card.asesor}</Text>
          </Row>
        ) : (
          <TouchableOpacity onPress={(e)=>{e.stopPropagation();onAsignar(card);}}
            style={{ alignItems:"center", flexDirection:"row", gap:5, backgroundColor:C.bg, borderRadius:6, paddingHorizontal:8, paddingVertical:5, borderWidth:1, borderColor:C.border, borderStyle:"dashed", marginBottom:card.solicitud_avance?8:0 }}>
            <Feather name="user-plus" size={11} color={C.textMuted} />
            <Text style={{ fontSize:11, color:C.textMuted, fontWeight:"600" }}>Asignar asesor</Text>
          </TouchableOpacity>
        )}

        {card.solicitud_avance ? (
          <TouchableOpacity onPress={(e)=>{e.stopPropagation();onAprobarAvance(card);}}
            style={{ marginTop:2, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:5, backgroundColor:C.teal, borderRadius:7, paddingVertical:7 }}>
            <Feather name="check-circle" size={12} color="white" />
            <Text style={{ fontSize:11, color:"white", fontWeight:"700" }}>Aprobar avance de fase</Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function GestionProyectos() {
  const { colors: C } = useTheme();

  const PHASE_COLUMNS = [
    { id:"desarrollo", label:"En Desarrollo", color:C.amber,  bg:C.amberLight  },
    { id:"revision",   label:"En Revisión",   color:C.purple, bg:C.purpleLight },
    { id:"concluido",  label:"Concluido",      color:C.green,  bg:C.greenLight  },
  ];

  const [proyectos,   setProyectos]   = useState([]);
  const [empresas,    setEmpresas]    = useState([]);
  const [asesores,    setAsesores]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [active,      setActive]      = useState(null);
  const [showFilter,  setShowFilter]  = useState(false);
  const [filterPos,   setFilterPos]   = useState(null);
  const [priorityFilter, setPriorityFilter] = useState("Todas");
  const [toast,       setToast]       = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [editForm,    setEditForm]    = useState({ title:"", priority:"Media", tags:"" });
  const [saving,      setSaving]      = useState(false);
  const [showRegister,    setShowRegister]    = useState(false);
  const [registerForm,    setRegisterForm]    = useState(EMPTY_REGISTER_FORM);
  const [registering,     setRegistering]     = useState(false);
  const [showEmpresaPick, setShowEmpresaPick] = useState(false);
  const [asignarTarget,   setAsignarTarget]   = useState(null);
  const [asignarSel,      setAsignarSel]      = useState(null);
  const [asignando,       setAsignando]       = useState(false);
  const [searchAsesor,    setSearchAsesor]    = useState("");

  const filterBtnRef = useRef(null);

  const showToast = useCallback((msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const inputStyle = { padding:11, borderRadius:8, borderWidth:1, borderColor:C.border, fontSize:14, color:C.text, backgroundColor:C.bg };

  const fetchProyectos = useCallback(() => {
    setLoading(true);
    apiClient.get("/api/jefe/proyectos").then((res) => {
      if (res.ok && res.body?.ok) setProyectos(res.body.proyectos);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchProyectos();
    apiClient.get("/api/jefe/empresas").then((res) => { if (res.ok && res.body?.ok) setEmpresas(res.body.empresas); });
    apiClient.get("/api/jefe/asignacion/datos").then((res) => { if (res.ok && res.body?.ok) setAsesores(res.body.asesores||[]); });
  }, []);

  const { subscribe } = useWebSocket();
  useEffect(() => {
    const off1 = subscribe("proyecto_solicitud_avance", (data) => {
      setProyectos((prev) => prev.map((p) => p.id===data.proyectoId ? {...p, solicitud_avance:true} : p));
      showToast(`📬 "${data.titulo}" solicita avance de fase`, "info");
    });
    const off2 = subscribe("asesor_asignado", () => fetchProyectos());
    return () => { off1(); off2(); };
  }, [subscribe, fetchProyectos, showToast]);

  const columns = React.useMemo(
    () => PHASE_COLUMNS.map((col) => ({
      ...col,
      cards: proyectos.filter((p) => p.phase===col.id && (priorityFilter==="Todas" || p.priority===priorityFilter)),
    })),
    [proyectos, priorityFilter],
  );

  // ── FIX: Filtro via Modal + measureInWindow ───────────────────────────────
  const openFilter = () => {
    filterBtnRef.current?.measureInWindow((x, y, w, h) => {
      const winW = Dimensions.get("window").width;
      setFilterPos({ top: y + h + 4, left: Math.max(8, x + w - 196) });
      setShowFilter(true);
    });
  };

  const openEdit = (card) => {
    setEditingCard(card);
    setEditForm({ title:card.title, priority:card.priority||"Media", tags:card.tags||"" });
  };

  const saveEdit = async () => {
    if (!editForm.title.trim()) return;
    setSaving(true);
    const res = await apiClient.put(`/api/jefe/proyectos/${editingCard.id}`, { title:editForm.title.trim(), priority:editForm.priority, tags:editForm.tags.trim() });
    if (res.ok) {
      setProyectos((prev) => prev.map((p) => p.id===editingCard.id ? {...p, title:editForm.title.trim(), priority:editForm.priority, tags:editForm.tags.trim()} : p));
      showToast("Proyecto actualizado");
    } else showToast(res.body?.mensaje||"Error al guardar","error");
    setSaving(false);
    setEditingCard(null);
  };

  const handleAprobarAvance = async (card) => {
    const res = await apiClient.put(`/api/jefe/proyectos/${card.id}/aprobar-avance`);
    if (res.ok && res.body?.ok) {
      setProyectos((prev) => prev.map((p) => p.id===card.id ? {...p, phase:res.body.nuevoEstado, solicitud_avance:false} : p));
      showToast("Avance aprobado correctamente");
    } else showToast(res.body?.mensaje||"Error al aprobar","error");
  };

  const handleRegister = async () => {
    if (!registerForm.titulo.trim()) { showToast("El título es requerido","error"); return; }
    setRegistering(true);
    const res = await apiClient.post("/api/jefe/proyectos", {
      titulo: registerForm.titulo.trim(), empresa_id: registerForm.empresa_id||null,
      prioridad: registerForm.prioridad, estado: registerForm.estado,
      tecnologias: registerForm.tecnologias.trim()||null, descripcion: registerForm.descripcion.trim()||null,
      periodo: registerForm.periodo.trim()||null,
    });
    if (res.ok) { setShowRegister(false); showToast("Proyecto registrado con éxito"); fetchProyectos(); }
    else showToast(res.body?.mensaje||"Error al registrar","error");
    setRegistering(false);
  };

  const openAsignar = (card) => { setAsignarTarget(card); setAsignarSel(null); setSearchAsesor(""); };

  const handleAsignar = async () => {
    if (!asignarSel) { showToast("Selecciona un asesor","error"); return; }
    setAsignando(true);
    const res = await apiClient.post(`/api/jefe/proyectos/${asignarTarget.id}/asesores`, { asesorId:asignarSel });
    if (res.ok) {
      const nombre = asesores.find(a=>a.id===asignarSel)?.nombre||"Asesor";
      setProyectos((prev) => prev.map((p) => p.id===asignarTarget.id ? {...p, asesor:nombre} : p));
      showToast(`Asesor asignado: ${nombre}`);
      setAsignarTarget(null);
    } else showToast(res.body?.mensaje||"Error al asignar","error");
    setAsignando(false);
  };

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <ScrollView contentContainerStyle={{ padding:24 }}>
        {/* Header */}
        <Row style={{ justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <View>
            <Text style={{ fontSize:22, fontWeight:"800", color:C.text }}>Gestión de Proyectos</Text>
            <Text style={{ fontSize:13, color:C.textMuted, marginTop:2 }}>Tablero {loading?"…":`· ${proyectos.length} proyectos`}</Text>
          </View>
          <Row style={{ gap:10 }}>
            <TouchableOpacity onPress={()=>{setRegisterForm(EMPTY_REGISTER_FORM);setShowRegister(true);}}
              style={{ flexDirection:"row", alignItems:"center", gap:6, backgroundColor:C.teal, paddingHorizontal:14, paddingVertical:9, borderRadius:9 }}>
              <Feather name="plus" size={14} color="white" />
              <Text style={{ fontSize:13, color:"white", fontWeight:"700" }}>Registrar proyecto</Text>
            </TouchableOpacity>

            {/* Filtro — Modal + measureInWindow */}
            <TouchableOpacity
              ref={filterBtnRef}
              onPress={showFilter ? ()=>setShowFilter(false) : openFilter}
              style={{
                flexDirection:"row", alignItems:"center", gap:5, borderWidth:1,
                borderColor: priorityFilter!=="Todas" ? C.teal : C.border,
                paddingHorizontal:12, paddingVertical:9, borderRadius:9,
                backgroundColor: priorityFilter!=="Todas" ? C.tealLighter : C.card,
              }}
            >
              <Feather name="filter" size={13} color={priorityFilter!=="Todas"?C.teal:C.textMuted} />
              <Text style={{ fontSize:12, fontWeight:"600", color:priorityFilter!=="Todas"?C.teal:C.textMuted }}>
                {priorityFilter==="Todas" ? "Filtrar" : priorityFilter}
              </Text>
            </TouchableOpacity>
          </Row>
        </Row>

        {/* Tablero */}
        {loading ? (
          <View style={{ alignItems:"center", paddingTop:60 }}>
            <ActivityIndicator size="large" color={C.teal} />
            <Text style={{ marginTop:12, color:C.textMuted, fontSize:14 }}>Cargando proyectos…</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Row style={{ gap:14, alignItems:"flex-start" }}>
              {columns.map((col) => (
                <View key={col.id} style={{ width:270, backgroundColor:C.card, borderRadius:14, borderWidth:1, borderColor:C.border, overflow:"hidden" }}>
                  <View style={{ padding:14, borderBottomWidth:1, borderBottomColor:C.border }}>
                    <Row style={{ alignItems:"center", justifyContent:"space-between" }}>
                      <Row style={{ alignItems:"center", gap:8 }}>
                        <View style={{ width:10, height:10, borderRadius:5, backgroundColor:col.color }} />
                        <Text style={{ fontSize:13, fontWeight:"800", color:C.text }}>{col.label}</Text>
                      </Row>
                      <View style={{ backgroundColor:col.bg, borderRadius:20, paddingHorizontal:9, paddingVertical:2 }}>
                        <Text style={{ fontSize:11, fontWeight:"700", color:col.color }}>{col.cards.length}</Text>
                      </View>
                    </Row>
                  </View>
                  <View style={{ padding:10, gap:10 }}>
                    {col.cards.length===0 ? (
                      <View style={{ alignItems:"center", paddingVertical:24 }}>
                        <Feather name="inbox" size={22} color={C.border} />
                        <Text style={{ fontSize:11, color:C.textLight, marginTop:6 }}>Sin proyectos</Text>
                      </View>
                    ) : col.cards.map((card,i) => (
                      <ProjectCard key={card.id} card={card} index={i} col={col} active={active===card.id}
                        onPress={()=>setActive(active===card.id?null:card.id)}
                        onEdit={openEdit} onAprobarAvance={handleAprobarAvance} onAsignar={openAsignar}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </Row>
          </ScrollView>
        )}
      </ScrollView>

      {/* Toast */}
      {toast && (
        <View style={{ position:"absolute", bottom:24, left:24, right:24, backgroundColor:toast.type==="error"?C.red:toast.type==="info"?C.blue:C.teal, borderRadius:10, padding:14, flexDirection:"row", alignItems:"center", gap:10 }}>
          <Feather name={toast.type==="error"?"alert-circle":"check-circle"} size={16} color="white" />
          <Text style={{ color:"white", fontWeight:"600", fontSize:13, flex:1 }}>{toast.msg}</Text>
        </View>
      )}

      {/* ── Modal: Filtro prioridad (fuera del ScrollView) ── */}
      <Modal visible={showFilter} transparent animationType="none">
        <Pressable style={{ flex:1 }} onPress={()=>setShowFilter(false)}>
          {filterPos && (
            <Pressable
              style={{
                position:"absolute", top:filterPos.top, left:filterPos.left, width:196,
                backgroundColor:C.card, borderRadius:10, borderWidth:1, borderColor:C.border, padding:12,
                shadowColor:"#000", shadowOpacity:0.14, shadowRadius:12, shadowOffset:{width:0,height:4}, elevation:24,
              }}
              onPress={(e)=>e.stopPropagation()}
            >
              <Text style={{ fontSize:11, color:C.textMuted, fontWeight:"700", marginBottom:8 }}>Prioridad</Text>
              {["Todas","Alta","Media","Baja"].map((option) => (
                <TouchableOpacity key={option} onPress={()=>{setPriorityFilter(option);setShowFilter(false);}}
                  style={{ paddingVertical:8, flexDirection:"row", alignItems:"center", gap:8 }}>
                  {priorityFilter===option && <Feather name="check" size={11} color={C.teal} />}
                  <Text style={{ fontSize:13, fontWeight:priorityFilter===option?"800":"600", color:priorityFilter===option?C.teal:C.textSub }}>{option}</Text>
                </TouchableOpacity>
              ))}
            </Pressable>
          )}
        </Pressable>
      </Modal>

      {/* ══ Modal: Editar proyecto ══ */}
      <Modal visible={!!editingCard} transparent animationType="fade">
        <Pressable style={{ flex:1, backgroundColor:"rgba(0,0,0,0.45)", justifyContent:"center", alignItems:"center" }} onPress={()=>setEditingCard(null)}>
          <Pressable style={{ width:420, backgroundColor:C.card, borderRadius:16, padding:28, borderWidth:1, borderColor:C.border }} onPress={(e)=>e.stopPropagation()}>
            <Row style={{ justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <Text style={{ fontSize:18, fontWeight:"800", color:C.text }}>Editar Proyecto</Text>
              <TouchableOpacity onPress={()=>setEditingCard(null)}><Feather name="x" size={20} color={C.textMuted} /></TouchableOpacity>
            </Row>
            <Field label="Nombre del Proyecto" C={C}>
              <TextInput value={editForm.title} onChangeText={(v)=>setEditForm({...editForm,title:v})} placeholder="Nombre del proyecto" placeholderTextColor={C.textLight} style={inputStyle} />
            </Field>
            <Field label="Prioridad" C={C}>
              <Row style={{ gap:8 }}>
                {PRIORIDADES.map((p) => { const sel=editForm.priority===p; const cm=getPriorityStyle(p,C); return (
                  <TouchableOpacity key={p} onPress={()=>setEditForm({...editForm,priority:p})}
                    style={{ flex:1, paddingVertical:8, borderRadius:8, borderWidth:1.5, borderColor:sel?cm.color:C.border, backgroundColor:sel?cm.bg:C.bg, alignItems:"center" }}>
                    <Text style={{ fontSize:12, fontWeight:"700", color:sel?cm.color:C.textMuted }}>{p}</Text>
                  </TouchableOpacity>
                );})}
              </Row>
            </Field>
            <Field label="Tecnologías (separadas por coma)" C={C}>
              <TextInput value={editForm.tags} onChangeText={(v)=>setEditForm({...editForm,tags:v})} placeholder="React, Node.js, MySQL…" placeholderTextColor={C.textLight} style={inputStyle} />
            </Field>
            <Row style={{ gap:10 }}>
              <TouchableOpacity onPress={()=>setEditingCard(null)} style={{ flex:1, paddingVertical:11, borderRadius:9, borderWidth:1, borderColor:C.border, alignItems:"center" }}>
                <Text style={{ fontSize:14, fontWeight:"600", color:C.textMuted }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} disabled={saving} style={{ flex:2, paddingVertical:11, borderRadius:9, alignItems:"center", backgroundColor:saving?C.textLight:C.teal }}>
                {saving ? <ActivityIndicator size="small" color="white" /> : <Text style={{ fontSize:14, fontWeight:"700", color:"white" }}>Guardar Cambios</Text>}
              </TouchableOpacity>
            </Row>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ══ Modal: Asignar Asesor ══ */}
      <Modal visible={!!asignarTarget} transparent animationType="fade">
        <Pressable style={{ flex:1, backgroundColor:"rgba(0,0,0,0.45)", justifyContent:"center", alignItems:"center" }} onPress={()=>setAsignarTarget(null)}>
          <Pressable style={{ width:460, maxHeight:"70%", backgroundColor:C.card, borderRadius:16, borderWidth:1, borderColor:C.border, overflow:"hidden" }} onPress={(e)=>e.stopPropagation()}>
            <View style={{ padding:22, paddingBottom:16, borderBottomWidth:1, borderBottomColor:C.border }}>
              <Row style={{ justifyContent:"space-between", alignItems:"flex-start" }}>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:17, fontWeight:"800", color:C.text }}>Asignar Asesor</Text>
                  <Text style={{ fontSize:12, color:C.textMuted, marginTop:3 }} numberOfLines={1}>{asignarTarget?.title}</Text>
                </View>
                <TouchableOpacity onPress={()=>setAsignarTarget(null)} style={{ padding:4 }}><Feather name="x" size={18} color={C.textMuted} /></TouchableOpacity>
              </Row>
              <Row style={{ alignItems:"center", gap:8, backgroundColor:C.bg, borderRadius:8, borderWidth:1, borderColor:C.border, paddingHorizontal:10, paddingVertical:7, marginTop:14 }}>
                <Feather name="search" size={13} color={C.textMuted} />
                <TextInput value={searchAsesor} onChangeText={setSearchAsesor} placeholder="Buscar asesor…" placeholderTextColor={C.textLight} style={{ flex:1, fontSize:13, color:C.text }} />
              </Row>
            </View>
            <ScrollView style={{ maxHeight:320 }}>
              {asesores.filter((a)=>!searchAsesor||a.nombre.toLowerCase().includes(searchAsesor.toLowerCase())||(a.departamento||"").toLowerCase().includes(searchAsesor.toLowerCase())).map((a)=>{
                const sel=asignarSel===a.id;
                return (
                  <TouchableOpacity key={a.id} onPress={()=>setAsignarSel(sel?null:a.id)}
                    style={{ flexDirection:"row", alignItems:"center", padding:14, borderBottomWidth:1, borderBottomColor:C.borderLight, backgroundColor:sel?C.tealLighter:"transparent" }}>
                    <View style={{ width:38, height:38, borderRadius:19, backgroundColor:sel?C.teal:C.bg, borderWidth:1, borderColor:sel?C.teal:C.border, alignItems:"center", justifyContent:"center", marginRight:12 }}>
                      <Text style={{ fontSize:13, fontWeight:"800", color:sel?"white":C.textMuted }}>
                        {a.nombre.split(" ").map(w=>w[0]).slice(0,2).join("")}
                      </Text>
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={{ fontSize:14, fontWeight:"700", color:sel?C.teal:C.text }}>{a.nombre}</Text>
                      {a.departamento && <Text style={{ fontSize:11, color:C.textMuted, marginTop:1 }}>{a.departamento}</Text>}
                    </View>
                    <View style={{ backgroundColor:a.activos>0?C.amberLight:C.bg, borderRadius:12, paddingHorizontal:8, paddingVertical:3 }}>
                      <Text style={{ fontSize:10, fontWeight:"700", color:a.activos>0?C.amber:C.textMuted }}>{a.activos} activo{a.activos!==1?"s":""}</Text>
                    </View>
                    {sel && <Feather name="check-circle" size={16} color={C.teal} style={{ marginLeft:8 }} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={{ padding:18, borderTopWidth:1, borderTopColor:C.border }}>
              <Row style={{ gap:10 }}>
                <TouchableOpacity onPress={()=>setAsignarTarget(null)} style={{ flex:1, paddingVertical:11, borderRadius:9, borderWidth:1, borderColor:C.border, alignItems:"center" }}>
                  <Text style={{ fontSize:14, fontWeight:"600", color:C.textMuted }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAsignar} disabled={asignando||!asignarSel}
                  style={{ flex:2, paddingVertical:11, borderRadius:9, alignItems:"center", flexDirection:"row", justifyContent:"center", gap:7, backgroundColor:asignando||!asignarSel?C.textLight:C.teal }}>
                  {asignando ? <ActivityIndicator size="small" color="white" /> : (
                    <><Feather name="user-check" size={14} color="white" /><Text style={{ fontSize:14, fontWeight:"700", color:"white" }}>Confirmar Asignación</Text></>
                  )}
                </TouchableOpacity>
              </Row>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ══ Modal: Registrar Proyecto ══ */}
      <Modal visible={showRegister} transparent animationType="fade">
        <Pressable style={{ flex:1, backgroundColor:"rgba(0,0,0,0.45)", justifyContent:"center", alignItems:"center" }} onPress={()=>setShowRegister(false)}>
          <Pressable style={{ width:480, maxHeight:"85%", backgroundColor:C.card, borderRadius:16, borderWidth:1, borderColor:C.border, overflow:"hidden" }} onPress={(e)=>e.stopPropagation()}>
            <View style={{ padding:24, paddingBottom:18, borderBottomWidth:1, borderBottomColor:C.border }}>
              <Row style={{ justifyContent:"space-between", alignItems:"center" }}>
                <View>
                  <Text style={{ fontSize:18, fontWeight:"800", color:C.text }}>Registrar Proyecto</Text>
                  <Text style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>Completa los datos del nuevo proyecto</Text>
                </View>
                <TouchableOpacity onPress={()=>setShowRegister(false)} style={{ padding:6, borderRadius:8, backgroundColor:C.bg }}>
                  <Feather name="x" size={18} color={C.textMuted} />
                </TouchableOpacity>
              </Row>
            </View>
            <ScrollView contentContainerStyle={{ padding:24, paddingBottom:8 }} showsVerticalScrollIndicator={false}>
              <Field label="Título del Proyecto *" C={C}>
                <TextInput value={registerForm.titulo} onChangeText={(v)=>setRegisterForm({...registerForm,titulo:v})} placeholder="Nombre del proyecto" placeholderTextColor={C.textLight} style={inputStyle} />
              </Field>
              <Field label="Empresa" C={C}>
                <TouchableOpacity onPress={()=>setShowEmpresaPick(!showEmpresaPick)} style={{ ...inputStyle, flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
                  <Text style={{ fontSize:14, color:registerForm.empresa_id?C.text:C.textLight }}>
                    {registerForm.empresa_id ? empresas.find(e=>e.id===registerForm.empresa_id)?.name||"Seleccionar…" : "Seleccionar empresa…"}
                  </Text>
                  <Feather name={showEmpresaPick?"chevron-up":"chevron-down"} size={14} color={C.textMuted} />
                </TouchableOpacity>
                {showEmpresaPick && (
                  <View style={{ backgroundColor:C.card, borderRadius:8, borderWidth:1, borderColor:C.border, marginTop:4, maxHeight:180, overflow:"hidden" }}>
                    <ScrollView nestedScrollEnabled>
                      <TouchableOpacity onPress={()=>{setRegisterForm({...registerForm,empresa_id:""});setShowEmpresaPick(false);}} style={{ padding:11, borderBottomWidth:1, borderBottomColor:C.borderLight }}>
                        <Text style={{ fontSize:13, color:C.textMuted, fontStyle:"italic" }}>Sin empresa</Text>
                      </TouchableOpacity>
                      {empresas.map((emp)=>(
                        <TouchableOpacity key={emp.id} onPress={()=>{setRegisterForm({...registerForm,empresa_id:emp.id});setShowEmpresaPick(false);}}
                          style={{ padding:11, borderBottomWidth:1, borderBottomColor:C.borderLight, backgroundColor:registerForm.empresa_id===emp.id?C.tealLighter:"transparent" }}>
                          <Text style={{ fontSize:13, color:registerForm.empresa_id===emp.id?C.teal:C.text, fontWeight:registerForm.empresa_id===emp.id?"700":"400" }}>{emp.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </Field>
              <Field label="Prioridad" C={C}>
                <Row style={{ gap:8 }}>
                  {PRIORIDADES.map((p)=>{ const sel=registerForm.prioridad===p; const cm=getPriorityStyle(p,C); return (
                    <TouchableOpacity key={p} onPress={()=>setRegisterForm({...registerForm,prioridad:p})}
                      style={{ flex:1, paddingVertical:9, borderRadius:8, borderWidth:1.5, borderColor:sel?cm.color:C.border, backgroundColor:sel?cm.bg:C.bg, alignItems:"center" }}>
                      <Text style={{ fontSize:13, fontWeight:"700", color:sel?cm.color:C.textMuted }}>{p}</Text>
                    </TouchableOpacity>
                  );})}
                </Row>
              </Field>
              <Field label="Fase Inicial" C={C}>
                <Row style={{ gap:8 }}>
                  {FASES.map((f)=>{ const sel=registerForm.estado===f.id; const pc=PHASE_COLUMNS.find(c=>c.id===f.id); return (
                    <TouchableOpacity key={f.id} onPress={()=>setRegisterForm({...registerForm,estado:f.id})}
                      style={{ flex:1, paddingVertical:9, borderRadius:8, borderWidth:1.5, borderColor:sel?pc?.color||C.teal:C.border, backgroundColor:sel?pc?.bg||C.tealLight:C.bg, alignItems:"center" }}>
                      <Text style={{ fontSize:11, fontWeight:"700", textAlign:"center", color:sel?pc?.color||C.teal:C.textMuted }}>{f.label}</Text>
                    </TouchableOpacity>
                  );})}
                </Row>
              </Field>
              <Field label="Tecnologías (separadas por coma)" C={C}>
                <TextInput value={registerForm.tecnologias} onChangeText={(v)=>setRegisterForm({...registerForm,tecnologias:v})} placeholder="React, Node.js, MySQL…" placeholderTextColor={C.textLight} style={inputStyle} />
              </Field>
              <Field label="Período" C={C}>
                <TextInput value={registerForm.periodo} onChangeText={(v)=>setRegisterForm({...registerForm,periodo:v})} placeholder="Ej: Ene-Jun 2026" placeholderTextColor={C.textLight} style={inputStyle} />
              </Field>
              <Field label="Descripción" C={C}>
                <TextInput value={registerForm.descripcion} onChangeText={(v)=>setRegisterForm({...registerForm,descripcion:v})} placeholder="Descripción breve…" placeholderTextColor={C.textLight} multiline numberOfLines={3} style={{ ...inputStyle, minHeight:80, textAlignVertical:"top" }} />
              </Field>
            </ScrollView>
            <View style={{ padding:20, paddingTop:12, borderTopWidth:1, borderTopColor:C.border }}>
              <Row style={{ gap:10 }}>
                <TouchableOpacity onPress={()=>setShowRegister(false)} style={{ flex:1, paddingVertical:12, borderRadius:9, borderWidth:1, borderColor:C.border, alignItems:"center" }}>
                  <Text style={{ fontSize:14, fontWeight:"600", color:C.textMuted }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRegister} disabled={registering||!registerForm.titulo.trim()}
                  style={{ flex:2, paddingVertical:12, borderRadius:9, alignItems:"center", flexDirection:"row", justifyContent:"center", gap:7, backgroundColor:registering||!registerForm.titulo.trim()?C.textLight:C.teal }}>
                  {registering ? <ActivityIndicator size="small" color="white" /> : (
                    <><Feather name="save" size={14} color="white" /><Text style={{ fontSize:14, fontWeight:"700", color:"white" }}>Registrar Proyecto</Text></>
                  )}
                </TouchableOpacity>
              </Row>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
