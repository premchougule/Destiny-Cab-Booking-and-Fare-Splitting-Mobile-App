import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();

  return (
    <ScrollView style={styles.wrapper}>
      {/* Header/Navbar */}
      <View style={styles.navbar}>
        <Image source={require('./../../assets/images/logo.png')} style={styles.logo} />
        <View style={styles.navLinks}>
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Text style={styles.bookButtonText}>Book a Ride</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Share Your Ride. Save Money. Meet People.</Text>
        <Text style={styles.heroSubtitle}>Book a cab and split the cost easily.</Text>
        <View style={styles.rideForm}>
          <TextInput style={styles.input} placeholder=" Pickup location" />
          <TextInput style={styles.input} placeholder="Drop-off location" />
          <TouchableOpacity 
            style={styles.findButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Text style={styles.findButtonText}>Find a Shared Ride</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* How it works */}
      <View style={styles.howItWorks}>
        <Text style={styles.sectionTitle}>How It Works ?</Text>
        <View style={styles.steps}>
          <View style={styles.step}>
            <Image
              source={{ uri: 'https://img.icons8.com/ios-filled/50/000000/marker.png' }}
              style={styles.stepIcon}
            />
            <Text style={styles.stepText}>Find nearby cabs</Text>
          </View>
          <View style={styles.step}>
            <Image
              source={{ uri: 'https://img.icons8.com/ios-filled/50/000000/add-user-group-man-man.png' }}
              style={styles.stepIcon}
            />
            <Text style={styles.stepText}>Invite friends or share with others</Text>
          </View>
          <View style={styles.step}>
            <Image
              source={{ uri: 'https://img.icons8.com/ios-filled/50/clock--v1.png' }}
              style={styles.stepIcon}
            />
            <Text style={styles.stepText}>Save money and time</Text>
          </View>
        </View>
      </View>

      {/* Bottom nav + Footer */}
      <View style={styles.footer}>
        <View style={styles.footerText}>
          <Text style={{ color: '#666',fontFamily: 'outfit' }}>© 2025 Destiny. All rights reserved.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  navbar: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  logo: {
    width: 180,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 1,
  },
  bookButton: {
    backgroundColor: '#ffc107',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 'auto',
    marginTop: -60,
  },
  bookButtonText: {
    fontFamily: 'outfit-bold'
  },
  hero: {
    padding: 30,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 45,
    textAlign: 'left',
    marginBottom: 10,
    fontFamily: 'outfit-bold'
  },
  heroSubtitle: {
    marginTop: 10,
    fontSize: 20,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'outfit'
  },
  rideForm: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  input: {
    borderWidth: 2,
    borderColor: '#ccc',
    width: '90%',
    borderRadius: 8,
    padding: 20,
    marginBottom: 10,
    fontSize: 20,
    fontFamily: 'outfit'
  },
  findButton: {
    backgroundColor: '#ffc107',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  findButtonText: {
    fontSize: 20,
    fontFamily: 'outfit-bold'
  },
  howItWorks: {
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'outfit-bold'
  },
  steps: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  step: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 25,
    width: '90%',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  stepIcon: {
    width: 40,
    height: 40,
    marginBottom: 10,
  },
  stepText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    fontFamily: 'outfit'
  },
  footer: {
    marginTop: 20,
  },
  footerText: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
