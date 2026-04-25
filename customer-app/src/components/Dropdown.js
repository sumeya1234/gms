import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  SafeAreaView 
} from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import { colors } from '../theme/colors';

const Dropdown = ({ 
  label, 
  options, 
  selectedOption, 
  onSelect, 
  placeholder = "Select an option",
  keyExtractor = (item) => item.id,
  labelExtractor = (item) => item.label
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (item) => {
    onSelect(item);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity 
        style={styles.dropdownButton} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={[
          styles.selectedText, 
          !selectedOption && styles.placeholderText
        ]}>
          {selectedOption ? labelExtractor(selectedOption) : placeholder}
        </Text>
        <ChevronDown size={20} color={colors.textGray} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || "Select Option"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              keyExtractor={keyExtractor}
              renderItem={({ item }) => {
                const isSelected = selectedOption && keyExtractor(selectedOption) === keyExtractor(item);
                return (
                  <TouchableOpacity 
                    style={[
                      styles.optionItem,
                      isSelected && styles.optionItemActive
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextActive
                    ]}>
                      {labelExtractor(item)}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.listContent}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border || '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  selectedText: {
    fontSize: 16,
    color: colors.textDark,
  },
  placeholderText: {
    color: colors.textGray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  listContent: {
    paddingBottom: 20,
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgGray,
  },
  optionItemActive: {
    backgroundColor: colors.bgGray,
  },
  optionText: {
    fontSize: 16,
    color: colors.textDark,
  },
  optionTextActive: {
    color: colors.primaryBlue,
    fontWeight: 'bold',
  },
});

export default Dropdown;
