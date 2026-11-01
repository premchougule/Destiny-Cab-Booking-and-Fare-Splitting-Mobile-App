import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
    Alert,
    FlatList,
    Modal,
    Pressable,
    useWindowDimensions,
    StatusBar
} from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";

export default function ShareRide() {
  const router = useRouter();
  // Form state
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [availableSeats, setAvailableSeats] = useState('');
  const [pricePerSeat, setPricePerSeat] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  // Vehicle type selection modal
  const [modalVisible, setModalVisible] = useState(false);
  const vehicleTypes = ['Car', 'SUV', 'Van', 'Bike', 'Scooter', 'Other'];
  
  // Form validation
  const [errors, setErrors] = useState({});
  
  // App state
  const [currentUser, setCurrentUser] = useState(null);
  const [rides, setRides] = useState([]);
  const [activeRides, setActiveRides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });

  const { width, height } = useWindowDimensions();
  const isSmallDevice = width < 375;
  const isTablet = width > 768;
  const isLargeDevice = width > 1024;

  // Calculate dynamic scales based on screen size
  const scale = Math.min(width, height) / 375;
  const dynamicFontScale = Math.min(scale, 1.4);
  const contentScale = isTablet ? 0.8 : 1;

  // Initialize data
  useEffect(() => {
    initializePage();
  }, []);

  // Load active rides when rides array changes
  useEffect(() => {
    if (rides.length > 0 && currentUser) {
      loadActiveRides();
    }
  }, [rides, currentUser]);

  // Initialize page data
  const initializePage = async () => {
    try {
      // Get current user from AsyncStorage
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        // Navigate to sign in if no user is found
        // In a real app, you'd use router.replace('/auth/SignIn')
        Alert.alert("Not Logged In", "Please sign in to continue");
        return;
      }
      
      const userData = JSON.parse(userDataString);
      setCurrentUser(userData);
      
      // Get rides from AsyncStorage
      const ridesString = await AsyncStorage.getItem('rides');
      const storedRides = ridesString ? JSON.parse(ridesString) : [];
      setRides(storedRides);
      
    } catch (error) {
      console.error("Error initializing page:", error);
      showNotification("Error loading data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Load active rides
  const loadActiveRides = () => {
    const userRides = rides.filter(ride => 
      ride.driverEmail === currentUser.email && ride.status !== 'booked'
    );
    
    setActiveRides(userRides);
  };

  // Format and validate date (MM/DD/YYYY)
  const formatAndValidateDate = (text) => {
    // Remove non-numeric characters first
    let formatted = text.replace(/\D/g, '');
    
    // Format with slashes
    if (formatted.length >= 4) {
      formatted = formatted.slice(0, 2) + '/' + formatted.slice(2, 4) + '/' + formatted.slice(4);
    } else if (formatted.length >= 2) {
      formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
    }
    
    // Limit to 10 characters (MM/DD/YYYY)
    formatted = formatted.slice(0, 10);
    
    setDepartureDate(formatted);
    
    // Only validate if we have a complete date
    if (formatted.length === 10) {
      const [month, day, year] = formatted.split('/').map(Number);
      
      // Check if it's a valid date
      const date = new Date(year, month - 1, day);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      // Validate month, day, and year
      const isValidMonth = month >= 1 && month <= 12;
      const isValidDay = day >= 1 && day <= new Date(year, month, 0).getDate();
      const isValidYear = year >= currentDate.getFullYear();
      const isValidDate = date instanceof Date && !isNaN(date);
      
      if (!isValidMonth || !isValidDay || !isValidYear || !isValidDate) {
        setErrors(prev => ({ ...prev, departureDate: 'Please enter a valid future date' }));
      } else if (date < currentDate) {
        setErrors(prev => ({ ...prev, departureDate: 'Date cannot be in the past' }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.departureDate;
          return newErrors;
        });
      }
    }
  };

  // Format and validate time (HH:MM)
  const formatAndValidateTime = (text) => {
    // Remove non-numeric characters first
    let formatted = text.replace(/\D/g, '');
    
    // Format with colon
    if (formatted.length >= 2) {
      formatted = formatted.slice(0, 2) + ':' + formatted.slice(2);
    }
    
    // Limit to 5 characters (HH:MM)
    formatted = formatted.slice(0, 5);
    
    setDepartureTime(formatted);
    
    // Only validate if we have a complete time
    if (formatted.length === 5) {
      const [hours, minutes] = formatted.split(':').map(Number);
      
      // Validate hours and minutes
      const isValidHours = hours >= 0 && hours <= 23;
      const isValidMinutes = minutes >= 0 && minutes <= 59;
      
      if (!isValidHours || !isValidMinutes) {
        setErrors(prev => ({ ...prev, departureTime: 'Please enter a valid time (HH:MM)' }));
        return;
      }
      
      // If we have a valid date, check if the datetime is in the future
      if (departureDate && departureDate.length === 10) {
        const [month, day, year] = departureDate.split('/').map(Number);
        const inputDateTime = new Date(year, month - 1, day, hours, minutes);
        const currentDateTime = new Date();
        
        if (inputDateTime <= currentDateTime) {
          setErrors(prev => ({ ...prev, departureTime: 'Departure time must be in the future' }));
          return;
        }
      }
      
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.departureTime;
        return newErrors;
      });
    }
  };

  // Handle share ride form submission
  const handleShareRide = async () => {
    if (!validateForm()) return;
    
    try {
      // Format date and time
      const dateTimeString = `${departureDate}T${departureTime}`;
      
      // Create new ride object
      const newRide = {
        id: Date.now().toString(),
        driver: currentUser.fullName,
        driverEmail: currentUser.email,
        vehicle: vehicleModel,
        type: vehicleType,
        seats: parseInt(availableSeats),
        price: parseInt(pricePerSeat),
        departureTime: dateTimeString,
        pickup: pickupLocation,
        destination: destination,
        additionalInfo: additionalInfo,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      // Add ride to rides array
      const updatedRides = [...rides, newRide];
      setRides(updatedRides);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('rides', JSON.stringify(updatedRides));
      
      // Reset form
      resetForm();
      
      // Show success message
      showNotification('Ride shared successfully!', 'success');
      
    } catch (error) {
      console.error("Error sharing ride:", error);
      showNotification("Failed to share ride", "error");
    }
  };

  // Validate form with detailed error messages
  const validateForm = () => {
    let tempErrors = {};
    let isValid = true;

    if (!vehicleType) {
      tempErrors.vehicleType = "Vehicle type is required";
      isValid = false;
    }
    
    if (!vehicleModel) {
      tempErrors.vehicleModel = "Vehicle model is required";
      isValid = false;
    }
    
    if (!availableSeats) {
      tempErrors.availableSeats = "Number of available seats is required";
      isValid = false;
    } else if (parseInt(availableSeats) <= 0) {
      tempErrors.availableSeats = "Must have at least 1 available seat";
      isValid = false;
    } else if (parseInt(availableSeats) > 20) {
      tempErrors.availableSeats = "Maximum 20 seats allowed";
      isValid = false;
    }
    
    if (!pricePerSeat) {
      tempErrors.pricePerSeat = "Price per seat is required";
      isValid = false;
    } else if (parseInt(pricePerSeat) <= 0) {
      tempErrors.pricePerSeat = "Price must be greater than 0";
      isValid = false;
    }
    
    if (!pickupLocation) {
      tempErrors.pickupLocation = "Pickup location is required";
      isValid = false;
    }
    
    if (!destination) {
      tempErrors.destination = "Destination is required";
      isValid = false;
    }
    
    if (!departureDate) {
      tempErrors.departureDate = "Departure date is required";
      isValid = false;
    }
    
    if (!departureTime) {
      tempErrors.departureTime = "Departure time is required";
      isValid = false;
    }

    // Additional datetime validation
    if (departureDate && departureTime) {
      const [month, day, year] = departureDate.split('/').map(Number);
      const [hours, minutes] = departureTime.split(':').map(Number);
      const inputDateTime = new Date(year, month - 1, day, hours, minutes);
      const currentDateTime = new Date();

      if (inputDateTime <= currentDateTime) {
        tempErrors.departureTime = 'Departure date and time must be in the future';
        isValid = false;
      }
    }

    setErrors(tempErrors);
    
    if (!isValid) {
      showNotification("Please fix the errors in the form", "error");
    }
    
    return isValid;
  };

  // Reset form
  const resetForm = () => {
    setVehicleType('');
    setVehicleModel('');
    setAvailableSeats('');
    setPricePerSeat('');
    setPickupLocation('');
    setDestination('');
    setDepartureDate('');
    setDepartureTime('');
    setAdditionalInfo('');
    setErrors({});
  };

  // Cancel ride
  const cancelRide = async (rideId) => {
    Alert.alert(
      "Cancel Ride",
      "Are you sure you want to cancel this ride?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes", 
          onPress: async () => {
            try {
              // Remove ride from rides array
              const rideIndex = rides.findIndex(ride => ride.id === rideId);
              if (rideIndex !== -1) {
                // Create a new array without this ride
                const updatedRides = rides.filter(ride => ride.id !== rideId);
                setRides(updatedRides);
                
                // Save to AsyncStorage
                await AsyncStorage.setItem('rides', JSON.stringify(updatedRides));
                
                // Remove any bookings for this ride
                const bookingsString = await AsyncStorage.getItem('bookings');
                if (bookingsString) {
                  const bookings = JSON.parse(bookingsString);
                  const updatedBookings = bookings.filter(booking => booking.rideId !== rideId);
                  await AsyncStorage.setItem('bookings', JSON.stringify(updatedBookings));
                }
                
                showNotification('Ride cancelled successfully', 'success');
              }
            } catch (error) {
              console.error("Error cancelling ride:", error);
              showNotification("Failed to cancel ride", "error");
            }
          }
        }
      ]
    );
  };

  // Show notification
  const showNotification = (message, type = 'error') => {
    setNotification({
      message,
      type,
      visible: true
    });
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({...prev, visible: false}));
    }, 3000);
  };

  // Render ride card
  const renderRideCard = ({ item }) => {
    // Parse the departure time string correctly
    const formatDateTime = (dateTimeString) => {
      try {
        // Parse the date string
        const [datePart, timePart] = dateTimeString.split('T');
        const [month, day, year] = datePart.split('/');
        const [hours, minutes] = timePart.split(':');

        // Create date object (months are 0-based in JavaScript)
        const date = new Date(year, month - 1, day, hours, minutes);

        // Format date
        const formattedDate = date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        // Format time
        const formattedTime = date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        return { formattedDate, formattedTime };
      } catch (error) {
        console.error("Error formatting date:", error);
        return {
          formattedDate: 'Invalid Date',
          formattedTime: 'Invalid Time'
        };
      }
    };

    const { formattedDate, formattedTime } = formatDateTime(item.departureTime);

    return (
      <View style={styles.rideCard}>
        <View style={styles.rideHeader}>
          <View style={styles.rideInfo}>
            <Text style={styles.vehicleModel}>{item.vehicle}</Text>
            <Text style={styles.vehicleType}>{item.type}</Text>
          </View>
          <Text style={styles.price}>₹{item.price}/seat</Text>
        </View>
        
        <View style={styles.rideDetails}>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Pickup:</Text>
            <Text style={styles.detailValue}>{item.pickup}</Text>
          </View>
          
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Destination:</Text>
            <Text style={styles.detailValue}>{item.destination}</Text>
          </View>
          
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formattedDate}</Text>
          </View>

          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{formattedTime}</Text>
          </View>
          
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Seats:</Text>
            <Text style={styles.detailValue}>{item.seats} available</Text>
          </View>
        </View>
        
        <View style={styles.rideFooter}>
          <Text style={[styles.status, item.status === 'active' ? styles.activeStatus : styles.pendingStatus]}>
            {item.status.toUpperCase()}
          </Text>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => cancelRide(item.id)}
          >
            <Text style={styles.cancelButtonText}>Cancel Ride</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render empty active rides list
  const renderEmptyRides = () => (
    <View style={styles.noRides}>
      <Text style={styles.noRidesTitle}>No active rides</Text>
      <Text style={styles.noRidesSubtitle}>Share a ride to get started!</Text>
    </View>
  );

  const styles = StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: '#fff',
      padding: 15
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
    navLinks: {
      flexDirection: 'row',
      alignItems: 'center',
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
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
      width: '100%',
    },
    title: {
      fontSize: 32,
      fontFamily: 'outfit-bold',
      textAlign: 'center',
      marginBottom: 15,
    },
    subtitle: {
      fontSize: 16,
      color: '#777',
      textAlign: 'center',
      marginVertical: 10,
      maxWidth: '80%',
      fontFamily: 'outfit',
    },
    inputContainer: {
      width: '100%',
      marginVertical: 10,
    },
    label: {
      fontSize: 16,
      marginBottom: 5,
      color: '#333',
      fontFamily: 'outfit-bold',
    },
    requiredAsterisk: {
      color: 'red',
      fontSize: Math.min(width * (isTablet ? 0.02 : 0.04) * dynamicFontScale, 18),
    },
    input: {
      width: '100%',
      borderColor: '#ccc',
      borderWidth: 1,
      borderRadius: 8,
      padding: width * (isTablet ? 0.02 : 0.03),
      fontSize: Math.min(width * (isTablet ? 0.018 : 0.035) * dynamicFontScale, 16),
      fontFamily: 'outfit',
      backgroundColor: '#fff',
      minHeight: height * (isTablet ? 0.06 : 0.07),
    },
    inputError: {
      borderColor: 'red',
      borderWidth: 1,
    },
    errorText: {
      color: 'red',
      fontSize: Math.min(width * (isTablet ? 0.015 : 0.03) * dynamicFontScale, 14),
      marginTop: height * 0.01,
      fontFamily: 'outfit',
    },
    textArea: {
      minHeight: height * (isTablet ? 0.15 : 0.12),
      textAlignVertical: 'top',
    },
    buttonContainer: {
      width: '100%',
      maxWidth: isTablet ? 600 : '100%',
      marginTop: height * (isTablet ? 0.03 : 0.02),
      marginBottom: height * 0.03,
    },
    button: {
      backgroundColor: '#ffc107',
      padding: height * (isTablet ? 0.02 : 0.025),
      borderRadius: 10,
      width: '100%',
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
      fontSize: Math.min(width * (isTablet ? 0.025 : 0.04) * dynamicFontScale, 20),
      fontFamily: 'outfit-bold',
    },
    notification: {
      padding: height * 0.02,
      borderRadius: 8,
      marginHorizontal: width * (isTablet ? 0.04 : 0.03),
      marginTop: height * 0.02,
    },
    successNotification: {
      backgroundColor: '#d4edda',
      borderColor: '#c3e6cb',
    },
    errorNotification: {
      backgroundColor: '#f8d7da',
      borderColor: '#f5c6cb',
    },
    notificationText: {
      fontSize: Math.min(width * (isTablet ? 0.018 : 0.035) * dynamicFontScale, 16),
      fontFamily: 'outfit',
      textAlign: 'center',
    },
    // Modal styles
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
      width: isTablet ? '60%' : '80%',
      maxWidth: 600,
      backgroundColor: 'white',
      borderRadius: 20,
      padding: width * (isTablet ? 0.04 : 0.05),
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalTitle: {
      fontSize: Math.min(width * (isTablet ? 0.025 : 0.045) * dynamicFontScale, 24),
      marginBottom: height * 0.02,
      textAlign: 'center',
      fontFamily: 'outfit-bold',
    },
    modalItem: {
      padding: height * 0.02,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    modalItemText: {
      fontSize: Math.min(width * (isTablet ? 0.02 : 0.04) * dynamicFontScale, 18),
      fontFamily: 'outfit',
    },
    closeButton: {
      backgroundColor: '#f0f0f0',
      borderRadius: 10,
      padding: height * 0.015,
      marginTop: height * 0.02,
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: Math.min(width * (isTablet ? 0.018 : 0.035) * dynamicFontScale, 16),
      fontFamily: 'outfit-bold',
    },
    activeRidesContainer: {
      marginTop: 30,
      padding: 15,
      backgroundColor: '#f9f9f9',
      borderRadius: 10,
    },
    activeRidesTitle: {
      fontSize: 24,
      marginBottom: 15,
      textAlign: 'center',
      fontFamily: 'outfit-bold'
    },
    loadingText: {
      textAlign: 'center',
      fontSize: 16,
      marginVertical: 20,
      fontFamily: 'outfit'
    },
    ridesList: {
      marginTop: 10,
    },
    noRides: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 30,
    },
    noRidesTitle: {
      fontSize: 18,
      marginBottom: 10,
      fontFamily: 'outfit-bold'
    },
    noRidesSubtitle: {
      fontSize: 16,
      color: '#777',
      fontFamily: 'outfit'
    },
    rideCard: {
      backgroundColor: 'white',
      borderRadius: 10,
      padding: 15,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: '#eee',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    rideHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 15,
    },
    rideInfo: {
      flex: 1,
    },
    vehicleModel: {
      fontSize: 18,
      fontFamily: 'outfit-bold'
    },
    vehicleType: {
      color: '#777',
      fontSize: 14,
      fontFamily: 'outfit'
    },
    price: {
      fontSize: 16,
      color: '#28a745',
      fontFamily: 'outfit-bold'
    },
    rideDetails: {
      marginBottom: 15,
    },
    detail: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    detailLabel: {
      width: 100,
      fontFamily: 'outfit-bold'
    },
    detailValue: {
      flex: 1,
    },
    rideFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#eee',
      paddingTop: 15,
    },
    status: {
      fontSize: 14,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 5,
      fontFamily: 'outfit-bold'
    },
    activeStatus: {
      backgroundColor: '#e7f4e4',
      color: '#28a745',
    },
    pendingStatus: {
      backgroundColor: '#fff3cd',
      color: '#856404',
    },
    cancelButton: {
      backgroundColor: '#dc3545',
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 5,
    },
    cancelButtonText: {
      color: 'white',
      fontFamily: 'outfit-bold'
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
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

        {/* Notification */}
        {notification.visible && (
          <View style={[
            styles.notification, 
            notification.type === 'success' ? styles.successNotification : styles.errorNotification
          ]}>
            <Text style={styles.notificationText}>{notification.message}</Text>
          </View>
        )}
        
        {/* Vehicle Type Selection Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Select Vehicle Type</Text>
              {vehicleTypes.map((type) => (
                <Pressable
                  key={type}
                  style={styles.modalItem}
                  onPress={() => {
                    setVehicleType(type);
                    setModalVisible(false);
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.vehicleType;
                      return newErrors;
                    });
                  }}
                >
                  <Text style={styles.modalItemText}>{type}</Text>
                </Pressable>
              ))}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        {/* Share Ride Form */}
     <View style={styles.container}>
      <Text style={styles.title}>Share Your Ride</Text>
      <Text style={styles.subtitle}>Split the fare by inviting friends or other passengers.</Text>
     
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Vehicle Type<Text style={styles.requiredAsterisk}>*</Text></Text>
            <TouchableOpacity
              style={[styles.input, styles.pickerButton, errors.vehicleType && styles.inputError]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={vehicleType ? styles.inputText : styles.placeholderText}>
                {vehicleType || "Select Vehicle Type"}
              </Text>
            </TouchableOpacity>
            {errors.vehicleType && <Text style={styles.errorText}>{errors.vehicleType}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Vehicle Model<Text style={styles.requiredAsterisk}>*</Text></Text>
            <TextInput 
              style={[styles.input, errors.vehicleModel && styles.inputError]} 
              placeholder="Vehicle Model (e.g., Toyota Camry)" 
              value={vehicleModel}
              onChangeText={(text) => {
                setVehicleModel(text);
                if (text) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.vehicleModel;
                    return newErrors;
                  });
                }
              }}
            />
            {errors.vehicleModel && <Text style={styles.errorText}>{errors.vehicleModel}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Available Seats<Text style={styles.requiredAsterisk}>*</Text></Text>
            <TextInput 
              keyboardType='numeric' 
              style={[styles.input, errors.availableSeats && styles.inputError]} 
              placeholder="Number of available seats" 
              value={availableSeats}
              onChangeText={(text) => {
                // Allow only numbers
                const numericText = text.replace(/[^0-9]/g, '');
                setAvailableSeats(numericText);
                if (numericText) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.availableSeats;
                    return newErrors;
                  });
                }
              }}
              maxLength={2}
            />
            {errors.availableSeats && <Text style={styles.errorText}>{errors.availableSeats}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Price per Seat (₹)<Text style={styles.requiredAsterisk}>*</Text></Text>
            <TextInput 
              keyboardType='numeric' 
              style={[styles.input, errors.pricePerSeat && styles.inputError]} 
              placeholder="Enter price per seat" 
              value={pricePerSeat}
              onChangeText={(text) => {
                // Allow only numbers
                const numericText = text.replace(/[^0-9]/g, '');
                setPricePerSeat(numericText);
                if (numericText) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.pricePerSeat;
                    return newErrors;
                  });
                }
              }}
            />
            {errors.pricePerSeat && <Text style={styles.errorText}>{errors.pricePerSeat}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Pickup Location<Text style={styles.requiredAsterisk}>*</Text></Text>
            <TextInput 
              style={[styles.input, errors.pickupLocation && styles.inputError]} 
              placeholder="Enter pickup location" 
              value={pickupLocation}
              onChangeText={(text) => {
                setPickupLocation(text);
                if (text) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.pickupLocation;
                    return newErrors;
                  });
                }
              }}
            />
            {errors.pickupLocation && <Text style={styles.errorText}>{errors.pickupLocation}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Destination<Text style={styles.requiredAsterisk}>*</Text></Text>
            <TextInput 
              style={[styles.input, errors.destination && styles.inputError]} 
              placeholder="Enter destination" 
              value={destination}
              onChangeText={(text) => {
                setDestination(text);
                if (text) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.destination;
                    return newErrors;
                  });
                }
              }}
            />
            {errors.destination && <Text style={styles.errorText}>{errors.destination}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Departure Date<Text style={styles.requiredAsterisk}>*</Text></Text>
            <TextInput 
              style={[styles.input, errors.departureDate && styles.inputError]} 
              placeholder="MM/DD/YYYY" 
              value={departureDate}
              onChangeText={formatAndValidateDate}
              keyboardType="numbers-and-punctuation"
            />
            {errors.departureDate && <Text style={styles.errorText}>{errors.departureDate}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Departure Time<Text style={styles.requiredAsterisk}>*</Text></Text>
            <TextInput 
              style={[styles.input, errors.departureTime && styles.inputError]} 
              placeholder="HH:MM (24-hour format)" 
              value={departureTime}
              onChangeText={formatAndValidateTime}
              keyboardType="numbers-and-punctuation"
            />
            {errors.departureTime && <Text style={styles.errorText}>{errors.departureTime}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Additional Information (Optional)</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholder="Any additional details about the ride" 
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
              multiline={true}
              numberOfLines={4}
            />
          </View>
    </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleShareRide}
          >
            <Text style={styles.buttonText}>Share a Ride</Text>
          </TouchableOpacity>
        </View>
        
        {/* Active Rides */}
        <View style={styles.activeRidesContainer}>
          <Text style={styles.activeRidesTitle}>My Active Rides</Text>
          
          {isLoading ? (
            <Text style={styles.loadingText}>Loading rides...</Text>
          ) : (
            <FlatList
              data={activeRides}
              renderItem={renderRideCard}
              keyExtractor={item => item.id}
              ListEmptyComponent={renderEmptyRides}
              style={styles.ridesList}
              contentContainerStyle={activeRides.length === 0 ? { flex: 1, justifyContent: 'center' } : {}}
            />
          )}
        </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
