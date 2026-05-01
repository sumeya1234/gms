import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Modal, FlatList, TextInput } from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import { colors } from '../../theme/colors';
import apiClient from '../../api/apiClient';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react-native';
import CustomAlert from '../../components/CustomAlert';

export default function TaskDetailScreen({ route, navigation }) {
  const { task } = route.params;
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(task.AssignmentStatus || 'Assigned');

  const [inventory, setInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [documentedItems, setDocumentedItems] = useState([]);
  const [savedParts, setSavedParts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantityInput, setQuantityInput] = useState('1');
  const [documenting, setDocumenting] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info', buttons: [] });

  const closeAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));
  const showAlert = (title, message, type = 'info', buttons = [{ text: 'OK', onPress: closeAlert }]) => {
    setAlertConfig({ visible: true, title, message, type, buttons });
  };

  const socketRef = useRef(null);
  const locationSubRef = useRef(null);

  useEffect(() => {
    let active = true;

    const startTracking = async () => {
      if (task.IsEmergency && status === 'Assigned') {
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus !== 'granted') {
          console.log('Permission to access location was denied');
          return;
        }

        socketRef.current = io(apiClient.defaults.baseURL);
        socketRef.current.on('connect', () => {
          socketRef.current.emit('join_tracking_room', {
            requestId: task.RequestID,
            role: 'Mechanic'
          });
        });

        if (active) {
          locationSubRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 5000,
              distanceInterval: 10,
            },
            (loc) => {
              if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('mechanic_location_update', {
                  requestId: task.RequestID,
                  latitude: loc.coords.latitude,
                  longitude: loc.coords.longitude
                });
              }
            }
          );
        }
      }
    };

    const stopTracking = () => {
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };

    if (task.IsEmergency && status === 'Assigned') {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      active = false;
      stopTracking();
    };
  }, [task.IsEmergency, status, task.RequestID]);

  useEffect(() => {
    if (task.GarageID) {
      fetchInventory();
    }
    if (task.RequestID) {
      fetchPartsUsed();
    }
  }, [task.GarageID, task.RequestID]);

  const fetchPartsUsed = async () => {
    try {
      const response = await apiClient.get(`/api/services/${task.RequestID}/items`);
      setSavedParts(response.data);
    } catch (err) {
      console.log('Error fetching saved parts:', err);
    }
  };

  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const response = await apiClient.get(`/api/inventory/${task.GarageID}`);
      setInventory(response.data);
    } catch (err) {
      console.log('Error fetching inventory:', err);
    } finally {
      setLoadingInventory(false);
    }
  };

  const updateStatus = async (newStatus) => {
    setLoading(true);
    try {
      await apiClient.put(`/api/services/assignments/${task.AssignmentID}/status`, { status: newStatus });
      setStatus(newStatus);
      if (newStatus === 'Completed') {
        showAlert(t('Success'), `${t('Status updated to')} ${newStatus}`, 'success', [{ text: 'OK', onPress: () => { closeAlert(); navigation.goBack(); } }]);
      } else {
        showAlert(t('Success'), `${t('Status updated to')} ${newStatus}`, 'success');
      }
    } catch (error) {
      console.log('Error updating task:', error);
      showAlert('Error', 'Failed to update task status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addItemToUsage = () => {
    if (!selectedItem) return;
    const qty = parseInt(quantityInput, 10);
    if (!qty || qty <= 0) {
      showAlert('Error', 'Please enter a valid quantity', 'error');
      return;
    }

    
    if (qty > selectedItem.Quantity) {
      showAlert('Error', `Only ${selectedItem.Quantity} available in stock.`, 'error');
      return;
    }

    setDocumentedItems([...documentedItems, {
      itemId: selectedItem.ItemID,
      itemName: selectedItem.ItemName,
      quantity: qty
    }]);

    setIsModalVisible(false);
    setSelectedItem(null);
    setQuantityInput('1');
  };

  const submitDocumentedItems = async () => {
    if (documentedItems.length === 0) return;
    setDocumenting(true);
    try {
      const itemsPayload = documentedItems.map(di => ({ itemId: di.itemId, quantity: di.quantity }));
      await apiClient.post(`/api/services/assignments/${task.AssignmentID}/items`, { itemsUsed: itemsPayload });
      showAlert(t('Success'), t('Items documented successfully.'), 'success');
      setDocumentedItems([]);
      fetchInventory(); 
      fetchPartsUsed(); 
    } catch (err) {
      console.log('Error documenting items', err?.response?.data || err);
      showAlert('Error', err?.response?.data?.message || 'Failed to document items', 'error');
    } finally {
      setDocumenting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t('Back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Task Details')}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {!!task.IsEmergency && (
            <View style={styles.emergencyBanner}>
              <AlertTriangle size={16} color="#fff" />
              <Text style={styles.emergencyBannerText}>EMERGENCY — Handle This Job Immediately</Text>
            </View>
          )}
          {!!task.IsEmergency && status === 'Assigned' && (
            <View style={[styles.emergencyBanner, { backgroundColor: '#10b981', marginTop: task.IsEmergency ? 0 : -20 }]}>
              <AlertTriangle size={16} color="#fff" />
              <Text style={styles.emergencyBannerText}>{t('Live Location Sharing is Active for this Emergency')}</Text>
            </View>
          )}

          <Text style={[styles.vehicleTitle, task.IsEmergency && { color: '#ff4444' }]}>{task.Model ? `${task.Model} (${task.PlateNumber})` : `Request #${task.RequestID}`}</Text>
          <View style={[styles.statusBadge, status === 'InProgress' ? styles.statusInProgress : {}]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>{t('Service Type')}</Text>
          <Text style={styles.descText}>{task.ServiceType}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>{t('Description')}</Text>
          <Text style={styles.descText}>{task.Description || 'No description provided.'}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>{t('Reported Issues')}</Text>
          {task.IsEmergency ? (
            <Text style={[styles.issueText, { color: colors.error, fontWeight: 'bold' }]}>Emergency Service Requested!</Text>
          ) : (
            <Text style={styles.issueText}>None reported.</Text>
          )}
        </View>

        {}
        {savedParts.length > 0 ? (
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.sectionLabel}>{t('Previously Used Parts')}</Text>
            {savedParts.map((sp, idx) => (
              <View key={idx} style={styles.docItemRow}>
                <Text style={styles.docItemName}>{sp.ItemName}</Text>
                <Text style={styles.docItemQty}>x{sp.QuantityUsed}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {status === 'InProgress' && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>{t('Document New Parts')}</Text>
              <TouchableOpacity style={styles.smallAddBtn} onPress={() => setIsModalVisible(true)}>
                <Text style={styles.smallAddBtnText}>+ {t('Add Part')}</Text>
              </TouchableOpacity>
            </View>

            {documentedItems.length === 0 ? (
              <Text style={styles.descText}>No unsubmitted items.</Text>
            ) : (
              documentedItems.map((di, idx) => (
                <View key={idx} style={styles.docItemRow}>
                  <Text style={styles.docItemName}>{di.itemName}</Text>
                  <Text style={styles.docItemQty}>x{di.quantity}</Text>
                </View>
              ))
            )}

            {documentedItems.length > 0 ? (
              <TouchableOpacity
                style={styles.submitItemsBtn}
                onPress={submitDocumentedItems}
                disabled={documenting}
              >
                {documenting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitItemsText}>{t('Submit Documented Parts')}</Text>}
              </TouchableOpacity>
            ) : null}
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        {status !== 'Completed' && (
          <View style={styles.actionRow}>
            {status === 'InProgress' ? (
              <TouchableOpacity style={styles.pauseBtn} onPress={() => updateStatus('Assigned')} disabled={loading}>
                <Text style={styles.pauseText}>Pause</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.startBtn} onPress={() => updateStatus('InProgress')} disabled={loading}>
                <Text style={styles.startText}>Start Job</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.doneBtn} onPress={() => updateStatus('Completed')} disabled={loading || documentedItems.length > 0}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.doneText}>Mark Done</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('Select Part')}</Text>

            {!selectedItem ? (
              loadingInventory ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <FlatList
                  data={inventory}
                  keyExtractor={item => item.ItemID.toString()}
                  style={{ maxHeight: 300 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.invItemRow} onPress={() => setSelectedItem(item)}>
                      <Text style={styles.invItemName}>{item.ItemName}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text style={{ padding: 20 }}>No inventory available.</Text>}
                />
              )
            ) : (
              <View style={{ paddingVertical: 20 }}>
                <Text style={styles.descText}>Item: <Text style={{ fontWeight: 'bold' }}>{selectedItem.ItemName}</Text></Text>
                <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t('Quantity')}</Text>
                <TextInput
                  style={styles.qtyInput}
                  keyboardType="numeric"
                  value={quantityInput}
                  onChangeText={setQuantityInput}
                />
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setIsModalVisible(false);
                  setSelectedItem(null);
                }}
              >
                <Text style={styles.modalCancelText}>{t('Cancel')}</Text>
              </TouchableOpacity>

              {!!selectedItem && (
                <TouchableOpacity style={styles.modalAdd} onPress={addItemToUsage}>
                  <Text style={styles.modalAddText}>{t('Add Part')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  backText: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  headerTitle: { color: colors.textMain, fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  card: { backgroundColor: colors.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ff4444',
    marginHorizontal: -20,
    marginTop: -20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
  },
  emergencyBannerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    flex: 1,
  },
  vehicleTitle: { color: colors.textMain, fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: colors.surfaceLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  statusInProgress: { backgroundColor: 'rgba(0, 229, 255, 0.1)', borderColor: colors.primary, borderWidth: 1 },
  statusText: { color: colors.primary, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  sectionLabel: { color: colors.textMuted, fontSize: 14, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
  descText: { color: colors.textMain, fontSize: 16, lineHeight: 24 },
  issueText: { color: colors.textMain, fontSize: 16, marginBottom: 4 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  actionRow: { flexDirection: 'row', gap: 12 },
  pauseBtn: { flex: 1, backgroundColor: '#e5e7eb', borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  pauseText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  startBtn: { flex: 1, backgroundColor: colors.surfaceLight, borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  startText: { color: colors.textMain, fontSize: 16, fontWeight: 'bold' },
  doneBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  doneText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  smallAddBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  smallAddBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  docItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  docItemName: { color: colors.textMain, fontSize: 16 },
  docItemQty: { color: colors.primary, fontWeight: 'bold', fontSize: 16 },
  submitItemsBtn: { backgroundColor: colors.primary, marginTop: 16, padding: 12, borderRadius: 8, alignItems: 'center' },
  submitItemsText: { color: '#fff', fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.surface, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: colors.border },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textMain, marginBottom: 16 },
  invItemRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' },
  invItemName: { color: colors.textMain, fontSize: 16 },
  invItemStock: { color: colors.textMuted, fontSize: 14 },
  qtyInput: { backgroundColor: colors.surfaceLight, color: colors.textMain, padding: 12, borderRadius: 8, fontSize: 18, marginTop: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  modalCancel: { padding: 12 },
  modalCancelText: { color: colors.textMuted, fontWeight: 'bold' },
  modalAdd: { backgroundColor: colors.primary, padding: 12, borderRadius: 8 },
  modalAddText: { color: '#fff', fontWeight: 'bold' }
});
