import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, StatusBar, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react-native';
import Button from '../../components/Button';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Top Image Section */}
      <View style={styles.imageSection}>
        <View style={styles.imageBackgroundWrapper}>
          <Image
            source={require('../../../assets/image.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        <View style={styles.textContainer}>
          <View style={styles.badgeWrap}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>GaragePro</Text>
            </View>
          </View>
          <Text style={styles.main}>Your vehicle's{'\n'}<Text style={{ color: colors.primaryBlue }}>best friend</Text></Text>
          <Text style={styles.sub}>
            Compare prices, find nearby mechanics, and manage your vehicle services all in one place.
          </Text>
        </View>

        <View style={styles.actionContainer}>
          <Button
            title={t('Login')}
            icon={<ArrowRight color={colors.white} size={20} />}
            onPress={() => navigation.navigate('Login')}
            style={styles.loginBtn}
          />
          <Button
            title={t('Create Account')}
            variant="outline"
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  imageSection: {
    flex: 1.1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  imageBackgroundWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  badgeWrap: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: 'rgba(52, 152, 219, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: colors.primaryBlue,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  main: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.textDark,
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 16,
    color: colors.textGray,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  actionContainer: {
    width: '100%',
    gap: 16, // using gap for clean spacing
  },
  loginBtn: {
    height: 56,
    borderRadius: 16,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  registerBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
  }
});
