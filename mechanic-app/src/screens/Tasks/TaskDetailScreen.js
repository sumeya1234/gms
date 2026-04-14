import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, FlatList, TextInput } from 'react-native';
import { colors } from '../../theme/colors';
import apiClient from '../../api/apiClient';
import { useTranslation } from 'react-i18next';

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
      Alert.alert(t('Success'), `${t('Status updated to')} ${newStatus}`);
      if (newStatus === 'Completed') {
        navigation.goBack();
      }
    } catch (error) {
      console.log('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task status');
    } finally {
      setLoading(false);
    }
  };

  const addItemToUsage = () => {
    if (!selectedItem) return;
    const qty = parseInt(quantityInput, 10);
    if (!qty || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    
    // Check if enough stock
    if (qty > selectedItem.Quantity) {
      Alert.alert('Error', `Only ${selectedItem.Quantity} available in stock.`);
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
      Alert.alert(t('Success'), t('Items documented successfully.'));
      setDocumentedItems([]); 
      fetchInventory(); // refresh inventory because we deducted from it
      fetchPartsUsed(); // refresh saved parts
    } catch (err) {
      console.log('Error documenting items', err?.response?.data || err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to document items');
    } finally {
      setDocumenting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {t('Back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Task Details')}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.vehicleTitle}>{task.Model ? `${task.Model} (${task.PlateNumber})` : `Request #${task.RequestID}`}</Text>
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

        {/* Saved Parts Section (always visible if parts exist) */}
        {savedParts.length > 0 && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.sectionLabel}>{t('Previously Used Parts')}</Text>
            {savedParts.map((sp, idx) => (
              <View key={idx} style={styles.docItemRow}>
                <Text style={styles.docItemName}>{sp.ItemName}</Text>
                <Text style={styles.docItemQty}>x{sp.QuantityUsed}</Text>
              </View>
            ))}
          </View>
        )}

        {status === 'InProgress' && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
              <Text style={[styles.sectionLabel, {marginBottom: 0}]}>{t('Document New Parts')}</Text>
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
            
            {documentedItems.length > 0 && (
              <TouchableOpacity 
                style={styles.submitItemsBtn} 
                onPress={submitDocumentedItems}
                disabled={documenting}
              >
                {documenting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitItemsText}>{t('Submit Documented Parts')}</Text>}
              </TouchableOpacity>
            )}
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

      {/* Part Picker Modal */}
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
                  renderItem={({item}) => (
                    <TouchableOpacity style={styles.invItemRow} onPress={() => setSelectedItem(item)}>
                      <Text style={styles.invItemName}>{item.ItemName}</Text>
                      <Text style={styles.invItemStock}>Stock: {item.Quantity}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text style={{padding: 20}}>No inventory available.</Text>}
                />
              )
            ) : (
              <View style={{paddingVertical: 20}}>
                <Text style={styles.descText}>Item: <Text style={{fontWeight:'bold'}}>{selectedItem.ItemName}</Text></Text>
                <Text style={styles.descText}>Available: {selectedItem.Quantity}</Text>
                <Text style={[styles.sectionLabel, {marginTop: 20}]}>{t('Quantity')}</Text>
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
              
              {selectedItem && (
                 <TouchableOpacity style={styles.modalAdd} onPress={addItemToUsage}>
                   <Text style={styles.modalAddText}>{t('Add Part')}</Text>
                 </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  backText: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  headerTitle: { color: colors.textMain, fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  card: { backgroundColor: colors.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
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
