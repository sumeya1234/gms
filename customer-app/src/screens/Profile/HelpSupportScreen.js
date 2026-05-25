import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking, Platform, StatusBar } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Phone, Mail, MessageCircle, HelpCircle, ChevronDown, ExternalLink, ShieldCheck, FileText } from 'lucide-react-native';
import { colors } from '../../theme/colors';

const FAQ_DATA = [
    {
        id: '1',
        question: 'How do I book a service?',
        answer: 'Go to the Home tab, find a garage that fits your needs, and click "Book Now". Select your vehicle and the services required, then choose a convenient time slot.'
    },
    {
        id: '2',
        question: 'What is Emergency SOS?',
        answer: 'Emergency SOS is for immediate breakdowns or towing needs. When you trigger SOS, the nearest available garage is notified instantly with your precise location.'
    },
    {
        id: '3',
        question: 'How can I track my vehicle status?',
        answer: 'You can check the real-time status of your active requests in the "History" tab. You will also receive notifications for status updates.'
    },
    {
        id: '4',
        question: 'Are there multiple payment options?',
        answer: 'Yes! We support Chapa (Online Checkout) and Cash payments. Some garages may require a small deposit for emergency services.'
    }
];

export default function HelpSupportScreen({ navigation }) {
    const { t } = useTranslation();
    const [expandedId, setExpandedId] = useState(null);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleCall = () => Linking.openURL('tel:+251911223344');
    const handleEmail = () => Linking.openURL('mailto:support@gms.com');
    const handleWhatsApp = () => Linking.openURL('whatsapp://send?phone=+251911223344&text=Hello GMS Support');

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('Help & Support')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Contact Support Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('Contact Support')}</Text>
                    <Text style={styles.sectionSub}>{t('Our team is here to help you 24/7')}</Text>

                    <View style={styles.contactGrid}>
                        <TouchableOpacity style={styles.contactCard} onPress={handleCall}>
                            <View style={[styles.contactIconWrap, { backgroundColor: '#e0f2fe' }]}>
                                <Phone size={24} color="#0284c7" />
                            </View>
                            <Text style={styles.contactLabel}>{t('Call Us')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.contactCard} onPress={handleEmail}>
                            <View style={[styles.contactIconWrap, { backgroundColor: '#f0fdf4' }]}>
                                <Mail size={24} color="#16a34a" />
                            </View>
                            <Text style={styles.contactLabel}>{t('Email Us')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.contactCard} onPress={handleWhatsApp}>
                            <View style={[styles.contactIconWrap, { backgroundColor: '#fdf4ff' }]}>
                                <MessageCircle size={24} color="#a21caf" />
                            </View>
                            <Text style={styles.contactLabel}>{t('WhatsApp')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* FAQs Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <HelpCircle size={20} color={colors.primaryBlue} />
                        <Text style={styles.sectionTitleAlt}>{t('Frequently Asked Questions')}</Text>
                    </View>

                    <View style={styles.faqList}>
                        {FAQ_DATA.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.faqItem}
                                onPress={() => toggleExpand(item.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.faqQuestionRow}>
                                    <Text style={styles.faqQuestion}>{t(item.question)}</Text>
                                    <ChevronDown
                                        size={20}
                                        color={colors.textGray}
                                        style={{ transform: [{ rotate: expandedId === item.id ? '180deg' : '0deg' }] }}
                                    />
                                </View>
                                {expandedId === item.id && (
                                    <Text style={styles.faqAnswer}>{t(item.answer)}</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Legal & Docs */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('Legal & Policies')}</Text>

                    <TouchableOpacity style={styles.linkRow}>
                        <View style={styles.linkLeft}>
                            <ShieldCheck size={20} color={colors.textGray} />
                            <Text style={styles.linkText}>{t('Privacy Policy')}</Text>
                        </View>
                        <ExternalLink size={16} color={colors.textGray} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkRow}>
                        <View style={styles.linkLeft}>
                            <FileText size={20} color={colors.textGray} />
                            <Text style={styles.linkText}>{t('Terms of Service')}</Text>
                        </View>
                        <ExternalLink size={16} color={colors.textGray} />
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>{t('GMS Customer App v1.2.0')}</Text>
                    <Text style={styles.copyrightText}>© 2026 {t('Garage Management System')}</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgGray,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
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
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textDark,
    },
    content: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textDark,
        marginBottom: 4,
    },
    sectionTitleAlt: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textDark,
    },
    sectionSub: {
        fontSize: 14,
        color: colors.textGray,
        marginBottom: 16,
    },
    contactGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    contactCard: {
        flex: 1,
        backgroundColor: colors.white,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    contactIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    contactLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.textDark,
    },
    faqList: {
        backgroundColor: colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    faqItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.bgGray,
    },
    faqQuestionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textDark,
        flex: 1,
        paddingRight: 12,
    },
    faqAnswer: {
        fontSize: 14,
        color: colors.textGray,
        marginTop: 12,
        lineHeight: 20,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: colors.white,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    linkLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    linkText: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.textDark,
    },
    footer: {
        alignItems: 'center',
        marginTop: 24,
    },
    versionText: {
        fontSize: 12,
        color: colors.textGray,
        marginBottom: 4,
    },
    copyrightText: {
        fontSize: 12,
        color: colors.textMuted,
    },
});
