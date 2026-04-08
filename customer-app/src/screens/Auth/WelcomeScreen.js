import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react-native';
import Button from '../../components/Button';
import { colors } from '../../theme/colors';

export default function WelcomeScreen({ navigation }) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      {/* Onboarding Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={require('../../../assets/image.png')} 
          style={styles.image} 
          resizeMode="contain" 
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>GaragePro Mobile</Text>
        <Text style={styles.main}>Your vehicle's{'\n'}best friend</Text>
        <Text style={styles.sub}>
          Compare prices, find nearby mechanics, and manage your vehicle services all in one place.
        </Text>
      </View>

      <View style={styles.actionContainer}>
        <Button 
          title={t('Login')} 
          icon={<ArrowRight color={colors.white} size={20} />}
          onPress={() => navigation.navigate('Login')}
        />
        <Button 
          title={t('Register')} 
          variant="outline"
          style={{ marginTop: 12 }}
          onPress={() => navigation.navigate('Register')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 24,
  },
  imageContainer: {
    height: 350,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    color: colors.primaryBlue,
    fontWeight: '600',
    marginBottom: 8,
  },
  main: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 12,
  },
  sub: {
    fontSize: 16,
    color: colors.textGray,
    lineHeight: 24,
  },
  actionContainer: {
    marginBottom: 20,
  }
});
