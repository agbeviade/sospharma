import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import {
  createPharmacy,
  deletePharmacy,
  fetchAllPharmacies,
  fetchDutyPharmacyIds,
  setDutySchedule,
  syncPharmaciesFromSource,
  type PharmacyInput,
} from '../src/lib/admin';
import type { Pharmacy } from '../src/types/pharmacy';
import { colors, radius, spacing } from '../src/theme';

type Tab = 'pharmacies' | 'garde';

export default function Admin() {
  const [tab, setTab] = useState<Tab>('pharmacies');

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabBar}>
        <TabBtn label="🏥 Pharmacies" active={tab === 'pharmacies'} onPress={() => setTab('pharmacies')} />
        <TabBtn label="🌙 Garde"      active={tab === 'garde'}       onPress={() => setTab('garde')} />
      </View>
      {tab === 'pharmacies' ? <PharmaciesTab /> : <GardeTab />}
    </View>
  );
}

// ── Tab: Pharmacies ─────────────────────────────────────────────────────────

function PharmaciesTab() {
  const [items, setItems] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setItems(await fetchAllPharmacies()); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncPharmaciesFromSource();
      Alert.alert(
        'Sync réussi',
        `${result.pharmacies} pharmacies importées, ${result.onDuty} de garde cette semaine.`,
        [{ text: 'OK', onPress: load }],
      );
    } catch (e: any) {
      Alert.alert('Erreur de sync', e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = (p: Pharmacy) => {
    Alert.alert(
      'Supprimer ?',
      `Supprimer "${p.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            try { await deletePharmacy(p.id); load(); }
            catch (e: any) { Alert.alert('Erreur', e.message); }
          },
        },
      ],
    );
  };

  if (loading) return <CenteredSpinner />;
  if (error) return <ErrorBox msg={error} onRetry={load} />;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.syncBar}>
        <Text style={styles.syncCount}>{items.length} pharmacie{items.length > 1 ? 's' : ''}</Text>
        <Pressable
          style={[styles.syncBtn, syncing && { opacity: 0.6 }]}
          onPress={handleSync}
          disabled={syncing}
        >
          {syncing
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.syncBtnText}>🔄 Sync site</Text>}
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: spacing.lg }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowMeta}>{item.commune}{item.phone ? ` • ${item.phone}` : ''}</Text>
            </View>
            <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item)}>
              <Text style={styles.deleteBtnText}>🗑</Text>
            </Pressable>
          </View>
        )}
      />
      <Pressable style={styles.fab} onPress={() => setShowForm(true)}>
        <Text style={styles.fabText}>+ Ajouter</Text>
      </Pressable>
      <AddPharmacyModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => { setShowForm(false); load(); }}
      />
    </View>
  );
}

// ── Tab: Garde ──────────────────────────────────────────────────────────────

function GardeTab() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [dutyIds, setDutyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fenêtre de garde : cette semaine lundi 00h → dimanche 23h59
  const weekStart = startOfWeek();
  const weekEnd = new Date(weekStart.getTime() + 7 * 86400_000 - 1000);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [all, ids] = await Promise.all([
        fetchAllPharmacies(),
        fetchDutyPharmacyIds(weekStart, weekEnd),
      ]);
      setPharmacies(all);
      setDutyIds(ids);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: string) => {
    setDutyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const windows = [...dutyIds].map((id) => ({
        pharmacyId: id,
        startAt: weekStart,
        endAt: weekEnd,
      }));
      await setDutySchedule(windows);
      Alert.alert('Succès', 'Planning de garde enregistré.');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CenteredSpinner />;
  if (error) return <ErrorBox msg={error} onRetry={load} />;

  const label = `${fmt(weekStart)} → ${fmt(weekEnd)}`;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.gardeHeader}>
        <Text style={styles.gardeTitle}>Semaine en cours</Text>
        <Text style={styles.gardeDates}>{label}</Text>
        <Text style={styles.gardeCount}>{dutyIds.size} pharmacie(s) de garde</Text>
      </View>
      <FlatList
        data={pharmacies}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: spacing.lg }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowMeta}>{item.commune}</Text>
            </View>
            <Switch
              value={dutyIds.has(item.id)}
              onValueChange={() => toggle(item.id)}
              trackColor={{ true: colors.primary }}
            />
          </View>
        )}
      />
      <View style={styles.saveBar}>
        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
          onPress={save}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Enregistrer le planning</Text>}
        </Pressable>
      </View>
    </View>
  );
}

// ── Modal: Ajouter une pharmacie ────────────────────────────────────────────

const COMMUNES = ['Abobo','Adjamé','Anyama','Attécoubé','Bingerville','Cocody',
  'Koumassi','Marcory','Plateau','Port-Bouët','Songon','Treichville','Yopougon'];

function AddPharmacyModal({ visible, onClose, onSaved }: {
  visible: boolean; onClose: () => void; onSaved: () => void;
}) {
  const blank: PharmacyInput = { name:'', commune:'Cocody', latitude:5.3599, longitude:-4.0083, phone:'', address:'' };
  const [form, setForm] = useState<PharmacyInput>(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof PharmacyInput, v: string) =>
    setForm((f) => ({ ...f, [k]: ['latitude','longitude'].includes(k) ? Number(v) : v }));

  const submit = async () => {
    if (!form.name || !form.commune) { setError('Nom et commune obligatoires.'); return; }
    setSaving(true);
    setError(null);
    try { await createPharmacy(form); setForm(blank); onSaved(); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nouvelle pharmacie</Text>
          <Pressable onPress={onClose}><Text style={styles.modalClose}>✕</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
          {error && <Text style={styles.formError}>{error}</Text>}

          <Field label="Nom *" value={form.name} onChangeText={(v) => set('name', v)} placeholder="Pharmacie de la Paix" />
          <Text style={styles.fieldLabel}>Commune *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm as any }}>
              {COMMUNES.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.communeChip, form.commune === c && styles.communeChipActive]}
                  onPress={() => set('commune', c)}
                >
                  <Text style={[styles.communeChipText, form.commune === c && { color: '#fff' }]}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <Field label="Téléphone" value={form.phone} onChangeText={(v) => set('phone', v)} placeholder="+225 27 XX XX XX XX" keyboardType="phone-pad" />
          <Field label="Adresse" value={form.address} onChangeText={(v) => set('address', v)} placeholder="Rue, quartier" />
          <View style={{ flexDirection: 'row', gap: spacing.md as any }}>
            <View style={{ flex: 1 }}>
              <Field label="Latitude" value={String(form.latitude)} onChangeText={(v) => set('latitude', v)} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Longitude" value={String(form.longitude)} onChangeText={(v) => set('longitude', v)} keyboardType="numeric" />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.saveBtn, { marginTop: spacing.lg }, pressed && { opacity: 0.85 }]}
            onPress={submit}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Enregistrer</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Petits composants ────────────────────────────────────────────────────────

function TabBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={onPress}>
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

function CenteredSpinner() {
  return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
}

function ErrorBox({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{msg}</Text>
      <Pressable style={styles.retryBtn} onPress={onRetry}><Text style={{ color: colors.primary }}>Réessayer</Text></Pressable>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: KeyboardTypeOptions;
}) {
  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
      />
    </>
  );
}

// ── Utils ────────────────────────────────────────────────────────────────────

function startOfWeek(): Date {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day; // adjust to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmt(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabBtnTextActive: { color: colors.primary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowName: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  deleteBtn: { padding: spacing.sm },
  deleteBtnText: { fontSize: 18 },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  gardeHeader: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gardeTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  gardeDates: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  gardeCount: { fontSize: 13, fontWeight: '700', color: colors.primary, marginTop: 4 },
  saveBar: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorText: { color: colors.accent, textAlign: 'center', marginBottom: spacing.md },
  retryBtn: { padding: spacing.md },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  modalClose: { fontSize: 20, color: '#fff', padding: spacing.sm },
  modalBody: { padding: spacing.lg },
  formError: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: 13,
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.xs },
  fieldInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.md,
  },
  communeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  communeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  communeChipText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  syncBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  syncCount: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 100,
    justifyContent: 'center',
  },
  syncBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
