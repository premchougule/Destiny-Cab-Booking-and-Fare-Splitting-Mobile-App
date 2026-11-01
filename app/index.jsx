import { useRouter } from "expo-router";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Platform,
  StyleSheet,
  StatusBar,
  useWindowDimensions
} from 'react-native';
import { useState, useEffect } from 'react';
import { 
  horizontalScale, 
  verticalScale, 
  moderateScale, 
  spacing, 
  isTablet,
  isSmallDevice,
  screenHeight
} from '../utils/responsive';

export default function WelcomeScreen({ navigation }) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
    },
    safeArea: {
      flex: 1,
    },
    imageContainer: {
      width: '100%',
      height: isTablet ? verticalScale(300) : verticalScale(350),
      marginTop: Platform.select({
        ios: verticalScale(20),
        android: StatusBar.currentHeight + verticalScale(20),
      }),
      marginBottom: verticalScale(20),
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
    },
    image: {
      width: isTablet ? '70%' : '90%',
      height: '100%',
      resizeMode: 'contain',
    },
    contentContainer: {
      padding: spacing.xl,
      backgroundColor: '#3487FF',
      alignItems: 'center',
      borderTopLeftRadius: moderateScale(35),
      borderTopRightRadius: moderateScale(35),
      minHeight: screenHeight * 0.45,
      paddingBottom: Platform.select({
        ios: spacing.xxl + verticalScale(10),
        android: spacing.xxl,
      }),
      width: '100%',
    },
    title: {
      fontSize: isSmallDevice ? moderateScale(35) : moderateScale(45),
      color: '#000',
      marginTop: verticalScale(10),
      fontFamily: 'outfit-bold',
      textAlign: 'center',
      includeFontPadding: false,
      padding: 0,
    },
    subtitle: {
      fontSize: isSmallDevice ? moderateScale(28) : moderateScale(32),
      color: '#ffc107',
      marginBottom: verticalScale(10),
      fontFamily: 'outfit-bold',
      textAlign: 'center',
      includeFontPadding: false,
      padding: 0,
    },
    description: {
      fontSize: moderateScale(16),
      textAlign: 'center',
      color: '#ffffff',
      marginBottom: verticalScale(30),
      fontFamily: 'outfit',
      paddingHorizontal: spacing.lg,
      maxWidth: isTablet ? 600 : '100%',
      lineHeight: moderateScale(24),
    },
    button: {
      backgroundColor: '#fff',
      borderRadius: moderateScale(15),
      paddingVertical: verticalScale(15),
      paddingHorizontal: horizontalScale(30),
      borderWidth: 2,
      borderColor: '#007aff',
      marginBottom: verticalScale(20),
      width: isTablet ? '60%' : '85%',
      maxWidth: 400,
      minWidth: horizontalScale(200),
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    buttonText: {
      color: '#007aff',
      fontSize: moderateScale(18),
      fontWeight: '600',
      fontFamily: 'outfit',
      includeFontPadding: false,
      padding: 0,
    },
    loginButton: {
      borderRadius: moderateScale(15),
      paddingVertical: verticalScale(15),
      paddingHorizontal: horizontalScale(40),
      borderWidth: 2,
      borderColor: '#fff',
      width: isTablet ? '40%' : '60%',
      maxWidth: 300,
      minWidth: horizontalScale(150),
      alignItems: 'center',
    },
    loginButtonText: {
      fontSize: moderateScale(16),
      color: '#ffffff',
      textDecorationLine: 'underline',
      fontFamily: 'outfit',
      includeFontPadding: false,
      padding: 0,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={require('./../assets/images/final.png')}
          style={styles.image}
        />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome to</Text>
        <Text style={styles.subtitle}>DESTINY</Text>
        <Text style={styles.description}>
          Book or share a cab ride effortlessly with friends and others!
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/auth/SignUp')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/auth/SignIn')}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>Log in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}




