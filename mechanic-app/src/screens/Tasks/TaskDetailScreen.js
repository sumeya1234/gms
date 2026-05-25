import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Modal, FlatList, TextInput, Linking, Platform, Image } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { io } from 'socket.io-client';
import { colors } from '../../theme/colors';
import apiClient from '../../api/apiClient';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, MapPin, Navigation, Phone, Eye, X } from 'lucide-react-native';
import CustomAlert from '../../components/CustomAlert';
import FloatingHint from '../../components/FloatingHint';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantityInput, setQuantityInput] = useState('1');
  const [documenting, setDocumenting] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState('30');
  const [etaDays, setEtaDays] = useState('0');
  const [etaHours, setEtaHours] = useState('0');
  const [etaLoading, setEtaLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info', buttons: [] });

  const closeAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));
  const showAlert = (title, message, type = 'info', buttons = [{ text: 'OK', onPress: closeAlert }]) => {
    setAlertConfig({ visible: true, title, message, type, buttons });
  };

  const [tutorialStep, setTutorialStep] = useState(null);

  useEffect(() => {
    const checkTutorial = async () => {
      const completed = await AsyncStorage.getItem('mechanic_tutorial_completed');
      if (completed !== 'true') {
        const step = await AsyncStorage.getItem('mechanic_tutorial_step');
        if (step && parseInt(step, 10) >= 4) {
          setTutorialStep(parseInt(step, 10));
        }
      }
    };
    checkTutorial();
  }, []);

  const nextHint = async () => {
    const nextStep = tutorialStep + 1;
    if (nextStep > 7) {
      setTutorialStep(null);
      await AsyncStorage.setItem('mechanic_tutorial_completed', 'true');
    } else {
      setTutorialStep(nextStep);
      await AsyncStorage.setItem('mechanic_tutorial_step', nextStep.toString());
    }
  };

  const [customerLocation, setCustomerLocation] = useState(null);
  const [liveCustomerLocation, setLiveCustomerLocation] = useState(null);

  const socketRef = useRef(null);
  const locationSubRef = useRef(null);

  useEffect(() => {
    let active = true;

    const startTracking = async () => {
      const isTrackingStatus = status === 'Assigned' || status === 'InProgress';
      if (task.IsEmergency && isTrackingStatus) {
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus !== 'granted') {
          console.log('Permission to access location was denied');
          return;
        }

        // Set customer location from task
        if (task.Latitude && task.Longitude) {
          setCustomerLocation({ latitude: parseFloat(task.Latitude), longitude: parseFloat(task.Longitude) });
        }

        socketRef.current = io(apiClient.defaults.baseURL);
        socketRef.current.on('connect', () => {
          socketRef.current.emit('join_tracking_room', {
            requestId: task.RequestID,
            role: 'Mechanic'
          });
        });

        socketRef.current.on('customer_location_update', (data) => {
          if (data.latitude && data.longitude) {
            setLiveCustomerLocation({ latitude: data.latitude, longitude: data.longitude });
          }
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

    const isTrackingStatus = status === 'Assigned' || status === 'InProgress';
    if (task.IsEmergency && isTrackingStatus) {
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

  const setTaskEta = async (minutes) => {
    setEtaLoading(true);
    try {
      const assignmentId = task.AssignmentID;
      let totalMinutes = parseInt(minutes, 10);

      // User said "choose the time by himself", let's use the inputs if they are > 0
      const days = parseInt(etaDays, 10) || 0;
      const hours = parseInt(etaHours, 10) || 0;
      const parsedMinutes = parseInt(minutes, 10) || 0;

      if (days > 0 || hours > 0) {
        totalMinutes = (days * 1440) + (hours * 60) + parsedMinutes;
      } else {
        totalMinutes = parsedMinutes;
      }

      if (totalMinutes === 0) totalMinutes = 30; // fallback

      const res = await apiClient.put(`/api/services/assignments/${assignmentId}/eta`, { estimatedMinutes: totalMinutes });

      // Update local UI state blindly since we don't refetch the task
      if (res.data && res.data.timeStr) {
        const estDate = new Date(Date.now() + totalMinutes * 60000);
        // We override this locally just so the manager/mechanic can see it updated locally without reloading
        // Or actually the task parameter doesn't even use ETA. 
        // Let's just reset the input fields as an indicator.
        setEtaMinutes('30');
        setEtaDays('0');
        setEtaHours('0');
      }

      showAlert(t('Success'), t('ETA updated. Customer and manager have been notified.'), 'success');
    } catch (err) {
      console.log('Error setting ETA:', err);
      showAlert(t('Error'), t('Failed to set ETA. Please try again.'), 'error');
    } finally {
      setEtaLoading(false);
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

      let successMsg = `${t('Status updated to')} ${newStatus}`;
      if (newStatus === 'InProgress') {
        successMsg = task.IsEmergency
          ? t('Journey started! Stay safe on your way to the customer.')
          : t('Job started! You can now document parts used.');
      } else if (newStatus === 'Arrived') {
        successMsg = t('Arrived at location! You can now start the job.');
      } else if (newStatus === 'Working') {
        successMsg = t('Job started! You can now document parts used.');
      } else if (newStatus === 'Completed') {
        successMsg = t('Excellent work! The job has been marked as completed.');
      }

      if (newStatus === 'Completed') {
        showAlert(t('Success'), successMsg, 'success', [{ text: 'OK', onPress: () => { closeAlert(); navigation.goBack(); } }]);
      } else {
        showAlert(t('Success'), successMsg, 'success');
      }
    } catch (error) {
      console.log('Error updating task:', error);
      showAlert(t('Error'), t('Failed to update task status'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const [currentMechanicLocation, setCurrentMechanicLocation] = useState(null);

  useEffect(() => {
    let watch;
    const startWatching = async () => {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus === 'granted') {
        watch = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 20 },
          (loc) => setCurrentMechanicLocation(loc.coords)
        );
      }
    };
    startWatching();
    return () => watch?.remove();
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c);
  };

  const dist = calculateDistance(
    currentMechanicLocation?.latitude,
    currentMechanicLocation?.longitude,
    customerLocation?.latitude,
    customerLocation?.longitude
  );

  const etaMins = dist ? Math.ceil((dist / 30) * 60) : null; // Assume 30km/h avg

  const openDirections = () => {
    const lat = task.Latitude;
    const lng = task.Longitude;
    const addr = task.Address || 'Customer Location';

    if (!lat || !lng) {
      showAlert(t('Notification'), t('No coordinates provided for this job.'), 'info');
      return;
    }

    const label = encodeURIComponent(addr);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`
    });

    if (url) Linking.openURL(url);
  };

  const addItemToUsage = () => {
    if (!selectedItem) return;
    const qty = parseInt(quantityInput, 10);
    if (!qty || qty <= 0) {
      showAlert(t('Error'), t('Please enter a valid quantity'), 'error');
      return;
    }


    if (qty > selectedItem.Quantity) {
      showAlert(t('Error'), t('Only {{quantity}} available in stock.', { quantity: selectedItem.Quantity }), 'error');
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
      showAlert(t('Error'), err?.response?.data?.message || t('Failed to document items'), 'error');
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
              <Text style={styles.emergencyBannerText}>{t('emergencyBanner') || 'EMERGENCY — Handle This Job Immediately'}</Text>
            </View>
          )}

          <FloatingHint
            visible={tutorialStep === 5 && !!task.IsEmergency}
            message={t("Live location sharing is active. The customer sees your journey for emergencies.")}
            position={{ top: 20, right: 20 }}
            arrowPosition="top"
            onDismiss={nextHint}
          />

          <Text style={[styles.vehicleTitle, task.IsEmergency && { color: colors.emergency }]}>{task.Model ? `${task.Model} (${task.PlateNumber})` : (task.RequestID ? `${t('Request')} #${task.RequestID}` : t('Task Details'))}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <View style={[styles.statusBadge, status === 'InProgress' ? styles.statusInProgress : {}]}>
              <Text style={styles.statusText}>{t(status)}</Text>
            </View>
          </View>

          <FloatingHint
            visible={tutorialStep === 4}
            message={t("This shows the current status of the job. You'll update this as you progress.")}
            position={{ top: 120, left: 20 }}
            arrowPosition="top"
            onDismiss={nextHint}
          />

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>{t('Service Type')}</Text>
          <Text style={styles.descText}>{task.ServiceType}</Text>

          <View style={styles.divider} />

          {task.CustomerPhone && (
            <>
              <Text style={styles.sectionLabel}>{t('Customer Contact')}</Text>
              <View style={styles.customerContactRow}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.avatarText}>{(task.CustomerName || 'C').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{task.CustomerName || t('Customer')}</Text>
                  <Text style={styles.customerPhone}>{task.CustomerPhone}</Text>
                </View>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${task.CustomerPhone}`)}
                >
                  <Phone size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {task.IssueImage && (
            <>
              <Text style={styles.sectionLabel}>{t('Issue Photos')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryContainer}>
                {(() => {
                  let images = [];
                  try {
                    images = typeof task.IssueImage === 'string' && task.IssueImage.startsWith('[')
                      ? JSON.parse(task.IssueImage)
                      : (Array.isArray(task.IssueImage) ? task.IssueImage : [task.IssueImage]);
                  } catch (e) {
                    images = [task.IssueImage];
                  }
                  return images.map((img, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.galleryPhotoWrap}
                      onPress={() => {
                        setSelectedImageIndex(idx);
                        setPhotoModalVisible(true);
                      }}
                    >
                      <Image source={{ uri: img }} style={styles.galleryImage} />
                    </TouchableOpacity>
                  ));
                })()}
              </ScrollView>
              <View style={styles.divider} />
            </>
          )}

          <Text style={styles.sectionLabel}>{t('Description')}</Text>
          <Text style={styles.descText}>{task.Description || t('No description provided.')}</Text>

          <View style={styles.divider} />

          {task.Address && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>{t('Customer Location')}</Text>
              <View style={styles.locationContainer}>
                <MapPin size={18} color={colors.primary} />
                <Text style={styles.locationDetailText}>{task.Address}</Text>
              </View>
              {task.Latitude && task.Longitude && (
                <>
                  <TouchableOpacity style={styles.directionsBtn} onPress={openDirections}>
                    <Navigation size={18} color="#fff" />
                    <Text style={styles.directionsBtnText}>{t('Get Directions')}</Text>
                  </TouchableOpacity>

                  <View style={styles.mapWrap}>
                    <View style={styles.mapHeader}>
                      <Text style={styles.mapTitle}>{t('To Customer')}</Text>
                      {dist !== null && (
                        <View style={styles.etaBadge}>
                          <Text style={styles.etaText}>{dist.toFixed(1)} km ({etaMins} {t('mins')})</Text>
                        </View>
                      )}
                    </View>
                    <MapView
                      style={styles.miniMap}
                      initialRegion={{
                        latitude: (parseFloat(task.Latitude) + (currentMechanicLocation?.latitude || parseFloat(task.Latitude))) / 2,
                        longitude: (parseFloat(task.Longitude) + (currentMechanicLocation?.longitude || parseFloat(task.Longitude))) / 2,
                        latitudeDelta: Math.abs(parseFloat(task.Latitude) - (currentMechanicLocation?.latitude || parseFloat(task.Latitude))) * 2 + 0.01,
                        longitudeDelta: Math.abs(parseFloat(task.Longitude) - (currentMechanicLocation?.longitude || parseFloat(task.Longitude))) * 2 + 0.01,
                      }}
                    >
                      <Marker
                        coordinate={{ latitude: parseFloat(task.Latitude), longitude: parseFloat(task.Longitude) }}
                        title={t("Service Location")}
                        description={t("Navigate here to find the vehicle")}
                        pinColor="red"
                      />
                      {liveCustomerLocation && (
                        <Marker
                          coordinate={liveCustomerLocation}
                          title={t("Customer")}
                          description={t("Live location of the customer")}
                          pinColor="green"
                        />
                      )}
                      {currentMechanicLocation && (
                        <Marker
                          coordinate={currentMechanicLocation}
                          title={t("Me")}
                          pinColor="blue"
                        />
                      )}
                    </MapView>
                  </View>
                </>
              )}
            </>
          )}
        </View>


        {(status === 'Working' || status === 'InProgress' || status === 'Arrived') ? (
          <View style={[styles.card, { marginTop: 16, borderColor: colors.primary }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <View style={styles.clockIconBg}>
                <Eye size={18} color={colors.primary} />
              </View>
              <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>{t('Set ETA to Finish')}</Text>
            </View>
            <Text style={styles.etaSubText}>{t('Inform the customer how much longer you expect this to take.')}</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.etaScroll}>
              {[15, 30, 45, 60, 90, 120].map(mins => (
                <TouchableOpacity
                  key={mins}
                  style={[styles.etaChip, etaMinutes === mins.toString() && etaDays === '0' && etaHours === '0' && styles.etaChipActive]}
                  onPress={() => {
                    setEtaMinutes(mins.toString());
                    setEtaDays('0');
                    setEtaHours('0');
                  }}
                >
                  <Text style={[styles.etaChipText, etaMinutes === mins.toString() && etaDays === '0' && etaHours === '0' && styles.etaChipTextActive]}>
                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.manualEtaRow}>
              <View style={styles.manualEtaField}>
                <Text style={styles.manualEtaLabel}>{t('Days')}</Text>
                <TextInput
                  style={styles.manualEtaInput}
                  keyboardType="numeric"
                  value={etaDays}
                  onChangeText={setEtaDays}
                  placeholder="0"
                />
              </View>
              <View style={styles.manualEtaField}>
                <Text style={styles.manualEtaLabel}>{t('Total Hours')}</Text>
                <TextInput
                  style={styles.manualEtaInput}
                  keyboardType="numeric"
                  value={etaHours}
                  onChangeText={setEtaHours}
                  placeholder="0"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.setEtaBtn}
              onPress={() => setTaskEta(etaMinutes)}
              disabled={etaLoading}
            >
              {etaLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.setEtaBtnText}>{t('Send ETA Update')}</Text>}
            </TouchableOpacity>
          </View>
        ) : null}

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

        {status === 'InProgress' || status === 'Working' ? (
          <View style={[styles.card, { marginTop: 16 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>{t('Document New Parts')}</Text>
              </View>
              <TouchableOpacity style={styles.smallAddBtn} onPress={() => setIsModalVisible(true)}>
                <Text style={styles.smallAddBtnText}>+ {t('Add Part')}</Text>
              </TouchableOpacity>
            </View>

            {documentedItems.length === 0 ? (
              <Text style={styles.descText}>{t('No unsubmitted items.')}</Text>
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
        ) : null}

      </ScrollView>

      <View style={styles.footer}>
        {status !== 'Completed' && (
          <View style={styles.actionRow}>
            <View style={{ width: '100%' }}>
              {task.IsEmergency ? (
                <View style={{ flexDirection: 'row', width: '100%' }}>
                  {status === 'Assigned' && (
                    <TouchableOpacity style={[styles.startBtn, { flex: 1, minHeight: 60, justifyContent: 'center' }]} onPress={() => updateStatus('InProgress')} disabled={loading}>
                      <Text style={[styles.startText, { color: '#ffffff', textAlign: 'center' }]}>{t('Start Journey') || 'Start Journey'}</Text>
                    </TouchableOpacity>
                  )}
                  {status === 'InProgress' && (
                    <TouchableOpacity style={[styles.doneBtn, { flex: 1, minHeight: 60, justifyContent: 'center' }]} onPress={() => updateStatus('Arrived')} disabled={loading}>
                      <Text style={[styles.doneText, { color: '#ffffff', textAlign: 'center' }]}>{t('I Have Arrived') || 'I Have Arrived'}</Text>
                    </TouchableOpacity>
                  )}
                  {status === 'Arrived' && (
                    <TouchableOpacity style={[styles.startBtn, { flex: 1, minHeight: 60, justifyContent: 'center' }]} onPress={() => updateStatus('Working')} disabled={loading}>
                      <Text style={[styles.startText, { color: '#ffffff', textAlign: 'center' }]}>{t('Start Job') || 'Start Job'}</Text>
                    </TouchableOpacity>
                  )}
                  {status === 'Working' && (
                    <>
                      <TouchableOpacity style={[styles.pauseBtn, { flex: 1, minHeight: 60, justifyContent: 'center', marginRight: 10 }]} onPress={() => updateStatus('Arrived')} disabled={loading}>
                        <Text style={[styles.pauseText, { color: '#000000', textAlign: 'center' }]}>{t('Pause') || 'Pause'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.doneBtn, { flex: 2, minHeight: 60, justifyContent: 'center' }]} onPress={() => updateStatus('Completed')} disabled={loading || documentedItems.length > 0}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.doneText, { color: '#ffffff', textAlign: 'center' }]}>{t('Mark Done') || 'Mark Done'}</Text>}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              ) : (
                <View style={{ flexDirection: 'row', width: '100%' }}>
                  {status === 'InProgress' || status === 'Working' ? (
                    <TouchableOpacity style={[styles.pauseBtn, { flex: 1, minHeight: 60, justifyContent: 'center', marginRight: 10 }]} onPress={() => updateStatus('Assigned')} disabled={loading}>
                      <Text style={[styles.pauseText, { color: '#000000', textAlign: 'center' }]}>{t('Pause') || 'Pause'}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.startBtn, { flex: 1, minHeight: 60, justifyContent: 'center', marginRight: 10 }]} onPress={() => updateStatus('InProgress')} disabled={loading}>
                      <Text style={[styles.startText, { color: '#ffffff', textAlign: 'center' }]}>{t('Start Job') || 'Start Job'}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.doneBtn, { flex: 1, minHeight: 60, justifyContent: 'center' }]} onPress={() => updateStatus('Completed')} disabled={loading || documentedItems.length > 0}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.doneText, { color: '#ffffff', textAlign: 'center' }]}>{t('Mark Done') || 'Mark Done'}</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      <FloatingHint
        visible={tutorialStep === 6}
        message={t("Use these buttons to update the state of the job. Tap 'Mark Done' only when finished.")}
        position={{ bottom: 100, left: 20 }}
        arrowPosition="bottom"
        onDismiss={nextHint}
      />

      <FloatingHint
        visible={tutorialStep === 7 && (status === 'InProgress' || status === 'Working')}
        message={t("Add parts from inventory used for this job. Submit them before marking done.")}
        position={{ top: 500, left: 20 }}
        arrowPosition="bottom"
        onDismiss={nextHint}
      />

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
                  ListEmptyComponent={<Text style={{ padding: 20 }}>{t('No inventory available.')}</Text>}
                />
              )
            ) : (
              <View style={{ paddingVertical: 20 }}>
                <Text style={styles.descText}>{t('Item')}: <Text style={{ fontWeight: 'bold' }}>{selectedItem.ItemName}</Text></Text>
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

      <Modal
        visible={photoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <SafeAreaView style={styles.fullscreenOverlay}>
          <TouchableOpacity
            style={styles.closeFullBtn}
            onPress={() => setPhotoModalVisible(false)}
          >
            <X size={28} color="#fff" />
          </TouchableOpacity>
          {(() => {
            let images = [];
            try {
              images = typeof task.IssueImage === 'string' && task.IssueImage.startsWith('[')
                ? JSON.parse(task.IssueImage)
                : (Array.isArray(task.IssueImage) ? task.IssueImage : [task.IssueImage]);
            } catch (e) {
              images = [task.IssueImage];
            }
            return (
              <ScrollView
                horizontal
                pagingEnabled
                index={selectedImageIndex}
                showsHorizontalScrollIndicator={false}
                style={{ width: '100%' }}
              >
                {images.map((img, idx) => (
                  <View key={idx} style={{ width: Platform.OS === 'web' ? 500 : 400, justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                      source={{ uri: img }}
                      style={styles.fullscreenImage}
                      resizeMode="contain"
                    />
                  </View>
                ))}
              </ScrollView>
            );
          })()}
        </SafeAreaView>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
      />
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  backText: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  headerTitle: { color: colors.textMain, fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  card: { backgroundColor: colors.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.emergency,
    marginHorizontal: -20,
    marginTop: -20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
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
  footer: { padding: 20, paddingTop: 10, paddingBottom: 40, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  pauseBtn: { flex: 1, backgroundColor: '#e5e7eb', borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  pauseText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  startBtn: { flex: 1, backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 16, alignItems: 'center', shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  startText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  doneBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  doneText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  btnLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 },
  btnLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textAlign: 'center' },

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
  modalAddText: { color: '#fff', fontWeight: 'bold' },
  customerContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  customerPhone: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  galleryContainer: {
    gap: 12,
    paddingVertical: 8,
  },
  galleryPhotoWrap: {
    width: 120,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: colors.border,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeFullBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
  locationDetailText: {
    color: colors.textMain,
    fontSize: 16,
    flex: 1,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  directionsBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mapWrap: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mapTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  etaBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  etaText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  miniMap: {
    width: '100%',
    height: 180,
  },
  clockIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  etaSubText: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 18
  },
  etaScroll: {
    marginBottom: 16
  },
  etaChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  etaChipActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    borderColor: colors.primary
  },
  etaChipText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textMuted
  },
  etaChipTextActive: {
    color: colors.primary
  },
  manualEtaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  manualEtaField: {
    flex: 1,
  },
  manualEtaLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: '600',
  },
  manualEtaInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.textDark,
  },
  setEtaBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  setEtaBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});
