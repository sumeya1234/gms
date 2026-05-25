import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { ChevronLeft, Send } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import apiClient from '../../api/client';

export default function ChatScreen({ navigation, route }) {
    const { t } = useTranslation();
    const { complaintId, complaintDescription } = route.params;
    const { user } = useAuthStore();
    const { messages, fetchMessages, addMessage, sendMessage, loading } = useChatStore();
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const socketRef = useRef(null);
    const flatListRef = useRef(null);

    useEffect(() => {
        fetchMessages(complaintId);

        const socket = io(apiClient.defaults.baseURL, { transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join_complaint_room', { complaintId });
        });

        socket.on('receive_complaint_message', (data) => {
            const normalized = {
                complaintId: Number(data.complaintId ?? data.ComplaintID),
                SenderID: data.SenderID ?? data.senderId,
                Message: data.Message ?? data.message,
                SenderRole: data.SenderRole ?? data.senderRole ?? 'Support',
                SenderName: data.SenderName ?? data.senderName,
                CreatedAt: data.CreatedAt ?? new Date().toISOString(),
            };
            // Use Number() on both sides to avoid string/number strict equality mismatch
            if (normalized.complaintId === Number(complaintId)) {
                addMessage(normalized);
            }
        });

        socket.on('connect_error', (err) => {
            console.warn('ChatScreen socket error:', err.message);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [complaintId]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const text = inputText.trim();
        setInputText('');
        setIsSending(true);

        try {
            const newMessage = await sendMessage(complaintId, text, user.id);
            if (newMessage) {
                // Local update
                addMessage(newMessage);
                // Socket update
                socketRef.current.emit('send_complaint_message', {
                    ...newMessage,
                    senderName: user.FullName
                });
            }
        } catch (err) {
            console.error("Chat send error:", err);
            setInputText(text); // Restore text if failed
        } finally {
            setIsSending(false);
        }
    };

    const renderItem = ({ item }) => {
        const isMe = item.SenderID === user.id;
        return (
            <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
                {!isMe && (
                    <Text style={styles.senderName}>{item.SenderName || t('Support')}</Text>
                )}
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                        {item.Message}
                    </Text>
                    <Text style={[styles.timeText, isMe ? styles.myTimeText : styles.theirTimeText]}>
                        {new Date(item.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={colors.textDark} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{t('Support Chat')}</Text>
                    <Text style={styles.headerSub} numberOfLines={1}>{complaintDescription}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.chatContainer}>
                {loading && messages.length === 0 ? (
                    <ActivityIndicator size="large" color={colors.primaryBlue} style={{ flex: 1 }} />
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => index.toString()}
                        contentContainerStyle={styles.listContent}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    />
                )}
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputArea}>
                    <TextInput
                        style={styles.input}
                        placeholder={t('Type a message...')}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || isSending}
                    >
                        {isSending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Send size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgGray },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: { padding: 8 },
    headerInfo: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontFamily: 'Inter-Bold', color: colors.textDark },
    headerSub: { fontSize: 12, color: colors.textGray, marginTop: 2 },
    chatContainer: { flex: 1 },
    listContent: { padding: 16, paddingBottom: 24 },
    messageWrapper: { marginBottom: 16, maxWidth: '80%' },
    myMessageWrapper: { alignSelf: 'flex-end' },
    theirMessageWrapper: { alignSelf: 'flex-start', flexDirection: 'column', alignItems: 'flex-start' },
    senderName: { fontSize: 11, color: colors.textGray, marginBottom: 4, marginLeft: 12 },
    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    myBubble: {
        backgroundColor: colors.primaryBlue,
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: colors.white,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    messageText: { fontSize: 15, lineHeight: 20 },
    myMessageText: { color: colors.white },
    theirMessageText: { color: colors.textDark },
    timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    myTimeText: { color: 'rgba(255,255,255,0.7)' },
    theirTimeText: { color: colors.textGray },
    inputArea: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: colors.white,
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    input: {
        flex: 1,
        backgroundColor: colors.bgGray,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        paddingTop: 8,
        marginRight: 10,
        fontSize: 15,
        maxHeight: 100,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primaryBlue,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: colors.border,
    }
});
