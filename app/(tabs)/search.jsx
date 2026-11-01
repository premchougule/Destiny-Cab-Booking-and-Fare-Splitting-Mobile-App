import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    FlatList,
    Alert,
    Switch,
    Platform,
    ActivityIndicator,
    Pressable,
    Dimensions
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function SearchScreen() {
  const router = useRouter();
  
  // Form state
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState('1');
  
  // Filter state
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [priceRange, setPriceRange] = useState(1000);
  const [vehicleTypes, setVehicleTypes] = useState({
    sedan: false,
    suv: false,
    hatchback: false,
    luxury: false
  });
  const [sortBy, setSortBy] = useState('price-asc');
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  
  // App state
  const [currentUser, setCurrentUser] = useState(null);
  const [allRides, setAllRides] = useState([]);
  const [displayedRides, setDisplayedRides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });
  const [rideCount, setRideCount] = useState(0);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rideTypeFilter, setRideTypeFilter] = useState('all'); // 'all', 'my-rides', 'others'

  // Initialize data
  useEffect(() => {
    initializePage();
  }, []);

  // Refresh data when tab is focused
  useFocusEffect(
    useCallback(() => {
      if (!isLoading) {
        refreshData();
      }
      return () => {};
    }, [refreshData, isLoading])
  );

  // Initialize page data
  const initializePage = async () => {
    try {
      // Get current user from AsyncStorage
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        // Navigate to sign in if no user is found
        Alert.alert(
          "Not Logged In", 
          "Please sign in to continue",
          [
            {
              text: "Sign In",
              onPress: () => router.push('/auth/SignIn')
            }
          ]
        );
        return;
      }
      
      const userData = JSON.parse(userDataString);
      setCurrentUser(userData);
      
      // Get rides from AsyncStorage (creating empty array if none exists)
      const ridesString = await AsyncStorage.getItem('rides');
      if (!ridesString) {
        // Initialize with empty array if no rides found
        await AsyncStorage.setItem('rides', JSON.stringify([]));
      }
      
      const storedRides = ridesString ? JSON.parse(ridesString) : [];
      setAllRides(storedRides);
      
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      
      // Set price range defaults
      setMinPrice(0);
      setMaxPrice(1000);
      setPriceRange(1000);
      
      if (storedRides.length > 0) {
        // Update price range based on available rides if any exist
        const prices = storedRides.map(ride => ride.price);
        if (prices.length > 0) {
          const minPriceValue = Math.min(...prices, 0);
          const maxPriceValue = Math.max(...prices, 1000);
          
          setMinPrice(minPriceValue);
          setMaxPrice(maxPriceValue);
          setPriceRange(maxPriceValue);
        }
        
        // Show all available rides
        showAllRides(storedRides);
      } else {
        // Empty state
        setDisplayedRides([]);
        setRideCount(0);
      }
      
    } catch (error) {
      console.error("Error initializing page:", error);
      showNotification("Error loading data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      const ridesString = await AsyncStorage.getItem('rides');
      const storedRides = ridesString ? JSON.parse(ridesString) : [];
      setAllRides(storedRides);
      
      if (searchPerformed) {
        searchRides(storedRides);
      } else {
        showAllRides(storedRides);
      }
      
    } catch (error) {
      console.error("Error refreshing data:", error);
      showNotification("Error refreshing data", "error");
    } finally {
      setRefreshing(false);
    }
  }, [searchPerformed]);

  // Reset filters
  const resetFilters = () => {
    // Reset vehicle types
    setVehicleTypes({
      sedan: false,
      suv: false,
      hatchback: false,
      luxury: false
    });
    
    // Reset price range
    setPriceRange(maxPrice);
    
    // Reset sort
    setSortBy('price-asc');
    
    // If search was performed, re-search with reset filters
    if (searchPerformed) {
      setTimeout(searchRides, 0);
    }
  };

  // Show all available rides
  const showAllRides = (rides = allRides) => {
    // Filter out any rides with 'booked' status
    const availableRides = rides.filter(ride => {
      return ride.status !== 'booked';
    });
    
    updateRidesList(sortRides(availableRides));
  };
  
  // Handle search
  const handleSearch = () => {
    if (!pickupLocation && !destination && !date) {
      showNotification("Please enter at least one search criterion", "error");
      return;
    }
    
    setSearchPerformed(true);
    searchRides();
  };

  // Search rides
  const searchRides = (rides = allRides) => {
    setSearchPerformed(true);
    
    let filteredRides = rides.filter(ride => {
      // Filter by status (exclude booked rides)
      if (ride.status === 'booked') return false;
      
      // Filter by pickup location if provided
      if (pickupLocation && !ride.pickup.toLowerCase().includes(pickupLocation.toLowerCase())) {
        return false;
      }
      
      // Filter by destination if provided
      if (destination && !ride.destination.toLowerCase().includes(destination.toLowerCase())) {
        return false;
      }
      
      // Filter by date if provided
      if (date) {
        const [rideMonth, rideDay, rideYear] = ride.departureTime.split('T')[0].split('/');
        const [searchMonth, searchDay, searchYear] = date.split('/');
        
        if (rideMonth !== searchMonth || rideDay !== searchDay || rideYear !== searchYear) {
          return false;
        }
      }
      
      // Filter by time if provided
      if (time) {
        const rideTime = ride.departureTime.split('T')[1];
        if (rideTime !== time) {
          return false;
        }
      }
      
      // Filter by seats if provided
      if (seats && parseInt(seats) > parseInt(ride.seats)) {
        return false;
      }
      
      // Filter by price range
      if (ride.price < minPrice || ride.price > priceRange) {
        return false;
      }
      
      // Filter by vehicle types if any selected
      const selectedTypes = Object.entries(vehicleTypes)
        .filter(([_, selected]) => selected)
        .map(([type]) => type);
      
      if (selectedTypes.length > 0 && !selectedTypes.includes(ride.type.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    // Sort filtered rides
    filteredRides = sortRides(filteredRides);
    
    // Update displayed rides
    updateRidesList(filteredRides);
  };

  // Sort rides
  const sortRides = (ridesToSort) => {
    return [...ridesToSort].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'time-asc':
          return new Date(a.departureTime) - new Date(b.departureTime);
        case 'time-desc':
          return new Date(b.departureTime) - new Date(a.departureTime);
        case 'seats-asc':
          return a.seats - b.seats;
        case 'seats-desc':
          return b.seats - a.seats;
        default:
          return 0;
      }
    });
  };

  // Update rides list
  const updateRidesList = (rides) => {
    // Apply ride type filter
    let filteredRides = rides;
    
    if (rideTypeFilter === 'my-rides' && currentUser) {
      filteredRides = rides.filter(ride => ride.driverEmail === currentUser.email);
    } else if (rideTypeFilter === 'others' && currentUser) {
      filteredRides = rides.filter(ride => ride.driverEmail !== currentUser.email);
    }
    
    setDisplayedRides(filteredRides);
    setRideCount(filteredRides.length);
  };
  
  // Filter rides by type
  const filterRidesByType = (type) => {
    setRideTypeFilter(type);
    
    let ridesToDisplay = searchPerformed 
      ? allRides.filter(ride => {
          if (ride.status === 'booked') return false;
          
          // Apply search filters
          const matchesPickup = !pickupLocation || ride.pickup.toLowerCase().includes(pickupLocation.toLowerCase());
          const matchesDestination = !destination || ride.destination.toLowerCase().includes(destination.toLowerCase());
          
          return matchesPickup && matchesDestination;
        })
      : allRides.filter(ride => ride.status !== 'booked');
    
    // Sort rides
    ridesToDisplay = sortRides(ridesToDisplay);
    
    // Apply ride type filter
    if (type === 'my-rides' && currentUser) {
      ridesToDisplay = ridesToDisplay.filter(ride => ride.driverEmail === currentUser.email);
    } else if (type === 'others' && currentUser) {
      ridesToDisplay = ridesToDisplay.filter(ride => ride.driverEmail !== currentUser.email);
    }
    
    setDisplayedRides(ridesToDisplay);
    setRideCount(ridesToDisplay.length);
  };

  // Book a ride
  const bookRide = async (rideId) => {
    try {
      // Find the ride in the rides array
      const rideIndex = allRides.findIndex(r => r.id === rideId);
      if (rideIndex === -1) {
        showNotification('Ride not found', 'error');
        return;
      }

      const ride = {...allRides[rideIndex]};
      if (ride.seats <= 0) {
        showNotification('Sorry, no seats available for this ride', 'error');
        return;
      }
      
      // Check if user is trying to book their own ride
      if (currentUser && ride.driverEmail === currentUser.email) {
        showNotification("You cannot book your own ride", "error");
        return;
      }

      // Confirm booking
      Alert.alert(
        "Confirm Booking",
        `Are you sure you want to book a ride from ${ride.pickup} to ${ride.destination}?\n\nPrice: ₹${ride.price} per seat`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Confirm",
            onPress: async () => {
              setIsLoading(true);
              
              // Mark ride as booked to remove it from search results
              ride.status = 'booked';
              ride.seats = 0;
              
              // Create booking
              const booking = {
                id: Date.now().toString(),
                rideId: ride.id,
                userId: currentUser.email,
                userName: currentUser.fullName,
                userMobile: currentUser.phone || '1234567890', // Fallback if user doesn't have phone
                status: 'confirmed',
                bookedAt: new Date().toISOString(),
                rideDetails: {
                  pickup: ride.pickup,
                  destination: ride.destination,
                  departureTime: ride.departureTime,
                  vehicle: ride.vehicle,
                  type: ride.type,
                  price: ride.price,
                  driver: ride.driver,
                  driverEmail: ride.driverEmail
                }
              };

              // Update rides array with the modified ride
              const updatedRides = [...allRides];
              updatedRides[rideIndex] = ride;
              setAllRides(updatedRides);
              
              // Update AsyncStorage
              await AsyncStorage.setItem('rides', JSON.stringify(updatedRides));
              
              // Add booking to bookings array
              const bookingsString = await AsyncStorage.getItem('bookings');
              const bookings = bookingsString ? JSON.parse(bookingsString) : [];
              bookings.push(booking);
              await AsyncStorage.setItem('bookings', JSON.stringify(bookings));

              // Send notification to ride owner
              await sendBookingNotification(ride, booking);

              // Remove this ride from displayed rides
              const filteredDisplayedRides = displayedRides.filter(r => r.id !== ride.id);
              setDisplayedRides(filteredDisplayedRides);
              setRideCount(filteredDisplayedRides.length);
              
              setIsLoading(false);
              
              // Show success message and ask if user wants to view bookings
              Alert.alert(
                "Booking Successful",
                "Your ride has been booked successfully!",
                [
                  {
                    text: "OK",
                    style: "cancel"
                  },
                  {
                    text: "View My Bookings",
                    onPress: () => router.push('/(tabs)/profile') // Navigate to profile or bookings page
                  }
                ]
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error booking ride:", error);
      showNotification("Failed to book ride", "error");
      setIsLoading(false);
    }
  };

  // Send booking notification
  const sendBookingNotification = async (ride, booking) => {
    try {
      // Get notifications from AsyncStorage
      const notificationsString = await AsyncStorage.getItem('notifications');
      const notifications = notificationsString ? JSON.parse(notificationsString) : {};
      
      // Create notification message
      const notification = {
        id: Date.now().toString(),
        type: 'booking',
        rideId: ride.id,
        message: `New booking from ${booking.userName} for your ride from ${ride.pickup} to ${ride.destination}`,
        timestamp: new Date().toISOString(),
        isRead: false
      };

      // Add notification to ride owner's notifications
      if (!notifications[ride.driverEmail]) {
        notifications[ride.driverEmail] = [];
      }
      notifications[ride.driverEmail].push(notification);
      
      // Save notifications to AsyncStorage
      await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
      
      console.log("Booking notification sent");
    } catch (error) {
      console.error("Error sending notification:", error);
    }
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

  // Helper function to check if two dates are the same day
  const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  // Toggle vehicle type selection
  const toggleVehicleType = (type) => {
    setVehicleTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
    
    if (searchPerformed) {
      // Use setTimeout to ensure state is updated before search
      setTimeout(searchRides, 0);
    }
  };

  // Handle price range change
  const handlePriceRangeChange = (value) => {
    setPriceRange(value);
    setMaxPrice(value);
    
    if (searchPerformed) {
      // Use setTimeout to ensure state is updated before search
      setTimeout(searchRides, 0);
    }
  };

  // Handle sort change
  const handleSortChange = (value) => {
    setSortBy(value);
    
    if (searchPerformed) {
      // Use setTimeout to ensure state is updated before search
      setTimeout(searchRides, 0);
    } else {
      // Sort the current displayed rides
      const sortedRides = sortRides(displayedRides);
      setDisplayedRides(sortedRides);
    }
  };

  // Quick search for popular destinations
  const quickSearch = (location, isPickup = true) => {
    if (isPickup) {
      setPickupLocation(location);
    } else {
      setDestination(location);
    }
    // Auto-search if both pickup and destination are set
    if ((isPickup && destination) || (!isPickup && pickupLocation)) {
      setTimeout(() => {
        setSearchPerformed(true);
        searchRides();
      }, 100);
    }
  };

  const cancelRide = (rideId) => {
    // Show confirmation dialog
    Alert.alert(
      "Cancel Ride",
      "Are you sure you want to remove this ride?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Get all rides
              const ridesString = await AsyncStorage.getItem('rides');
              if (!ridesString) {
                showNotification("No rides found", "error");
                return;
              }
              
              // Parse rides
              const rides = JSON.parse(ridesString);
              
              // Find and remove the ride
              const updatedRides = rides.filter(ride => ride.id !== rideId);
              
              // Update AsyncStorage
              await AsyncStorage.setItem('rides', JSON.stringify(updatedRides));
              
              // Update state
              setAllRides(updatedRides);
              if (searchPerformed) {
                searchRides(updatedRides);
              } else {
                showAllRides(updatedRides);
              }
              
              showNotification("Ride cancelled successfully", "success");
            } catch (error) {
              console.error("Error cancelling ride:", error);
              showNotification("Failed to cancel ride", "error");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
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
    
    setDate(formatted);
    
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
        showNotification('Please enter a valid future date', 'error');
        return false;
      } else if (date < currentDate) {
        showNotification('Date cannot be in the past', 'error');
        return false;
      }
      return true;
    }
    return false;
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
    
    setTime(formatted);
    
    // Only validate if we have a complete time
    if (formatted.length === 5) {
      const [hours, minutes] = formatted.split(':').map(Number);
      
      // Validate hours and minutes
      const isValidHours = hours >= 0 && hours <= 23;
      const isValidMinutes = minutes >= 0 && minutes <= 59;
      
      if (!isValidHours || !isValidMinutes) {
        showNotification('Please enter a valid time (HH:MM)', 'error');
        return false;
      }
      
      // If we have a valid date, check if the datetime is in the future
      if (date && date.length === 10) {
        const [month, day, year] = date.split('/').map(Number);
        const inputDateTime = new Date(year, month - 1, day, hours, minutes);
        const currentDateTime = new Date();
        
        if (inputDateTime <= currentDateTime) {
          showNotification('Departure time must be in the future', 'error');
          return false;
        }
      }
      return true;
    }
    return false;
  };

  // Format date and time for display
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

  // Render ride card
  const renderRideCard = ({ item }) => {
    const { formattedDate, formattedTime } = formatDateTime(item.departureTime);
    const isUserRide = currentUser && item.driverEmail === currentUser.email;
    
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
          {isUserRide ? (
            <TouchableOpacity 
              style={styles.cancelRideButton}
              onPress={() => cancelRide(item.id)}
            >
              <Text style={styles.cancelRideButtonText}>Cancel Ride</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.bookButton}
              onPress={() => bookRide(item.id)}
            >
              <Text style={styles.bookButtonText}>Book Ride</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.wrapper} showsVerticalScrollIndicator={false}>
      {/* Header/Navbar */}
      <View style={styles.navbar}>
        <Image source={require('./../../assets/images/logo.png')} style={styles.logo} />
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.push('/(tabs)/home')}
        >
          <Ionicons name="home-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      {/* Notification */}
      {notification.visible && (
        <View style={[
          styles.notification, 
          notification.type === 'success' ? styles.successNotification : 
          notification.type === 'info' ? styles.infoNotification : 
          styles.errorNotification
        ]}>
          <Text style={styles.notificationText}>{notification.message}</Text>
        </View>
      )}
      
      {/* Search Form */}
      <View style={styles.searchForm}>
        <View style={styles.inputRow}>
          <View style={[styles.inputContainer, {flex: 1}]}>
            <Text style={styles.label}>
              <Ionicons name="location" size={16} color="#555" /> Pickup Location
            </Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter pickup location" 
              value={pickupLocation}
              onChangeText={setPickupLocation}
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputContainer, {flex: 1}]}>
            <Text style={styles.label}>
              <Ionicons name="flag" size={16} color="#555" /> Destination
            </Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter destination" 
              value={destination}
              onChangeText={setDestination}
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputContainer, {flex: 1}]}>
            <Text style={styles.label}>
              <Ionicons name="calendar" size={16} color="#555" /> Date
            </Text>
            <TextInput 
              style={styles.input} 
              placeholder="MM/DD/YYYY" 
              value={date}
              onChangeText={formatAndValidateDate}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View style={[styles.inputContainer, {flex: 1, marginLeft: 10}]}>
            <Text style={styles.label}>
              <Ionicons name="time" size={16} color="#555" /> Time
            </Text>
            <TextInput 
              style={styles.input} 
              placeholder="HH:MM" 
              value={time}
              onChangeText={formatAndValidateTime}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputContainer, {flex: 1}]}>
            <Text style={styles.label}>
              <Ionicons name="people" size={16} color="#555" /> Seats
            </Text>
            <TextInput 
              style={styles.input} 
              placeholder="Number of seats" 
              value={seats}
              onChangeText={setSeats}
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => searchRides()}
        >
          <Text style={styles.searchButtonText}>Search Rides</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Toggle */}
      <TouchableOpacity 
        style={styles.filterToggle}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text style={styles.filterToggleText}>
          <Ionicons name={showFilters ? "chevron-up" : "chevron-down"} size={16} /> 
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Text>
      </TouchableOpacity>
      
      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Filters</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
          
          {/* Price Range */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Price Range: ₹{minPrice} - ₹{priceRange}</Text>
            <Slider
              style={styles.slider}
              minimumValue={minPrice}
              maximumValue={maxPrice}
              value={priceRange}
              onValueChange={handlePriceRangeChange}
              minimumTrackTintColor="#ffc107"
              maximumTrackTintColor="#ccc"
              thumbTintColor="#ffc107"
              step={10}
            />
          </View>
          
          {/* Vehicle Types */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Vehicle Types:</Text>
            <View style={styles.checkboxContainer}>
              {Object.entries(vehicleTypes).map(([type, isChecked]) => (
                <View key={type} style={styles.checkboxItem}>
                  <Switch
                    value={isChecked}
                    onValueChange={() => toggleVehicleType(type)}
                    trackColor={{ false: "#ccc", true: "#ffc107" }}
                    thumbColor={isChecked ? "#fff" : "#f4f3f4"}
                  />
                  <Text style={styles.checkboxLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Sort By */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort By:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={sortBy}
                onValueChange={handleSortChange}
                style={styles.picker}
              >
                <Picker.Item label="Price: Low to High" value="price-asc" />
                <Picker.Item label="Price: High to Low" value="price-desc" />
                <Picker.Item label="Departure: Earliest" value="time-asc" />
                <Picker.Item label="Departure: Latest" value="time-desc" />
                <Picker.Item label="Seats: Most Available" value="seats-desc" />
                <Picker.Item label="Seats: Least Available" value="seats-asc" />
              </Picker>
            </View>
          </View>
        </View>
      )}
      
      {/* Rides List */}
      <View style={styles.ridesContainer}>
        <View style={styles.ridesHeader}>
          <View style={styles.ridesTitleContainer}>
            <Text style={styles.ridesTitle}>Available Rides</Text>
            <View style={styles.rideCountBadge}>
              <Text style={styles.rideCount}>{rideCount}</Text>
            </View>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.clearAllButton}
              onPress={() => {
                Alert.alert(
                  "Clear All Rides",
                  "Are you sure you want to permanently delete all rides? Your bookings will be preserved. This action cannot be undone.",
                  [
                    {
                      text: "Cancel",
                      style: "cancel"
                    },
                    {
                      text: "Clear All",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          setIsLoading(true);
                          
                          // Clear only rides from AsyncStorage
                          await AsyncStorage.setItem('rides', JSON.stringify([]));
                          
                          // Don't clear bookings data - preserve user's booking history
                          
                          // Update state
                          setAllRides([]);
                          setDisplayedRides([]);
                          setRideCount(0);
                          setSearchPerformed(false);
                          
                          // Reset filters and ride type
                          resetFilters();
                          setRideTypeFilter('all');
                          
                          showNotification("All rides have been cleared successfully", "success");
                        } catch (error) {
                          console.error("Error clearing rides:", error);
                          showNotification("Failed to clear rides", "error");
                        } finally {
                          setIsLoading(false);
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Ride Type Filter Tabs */}
        <View style={styles.rideTypeTabs}>
          <TouchableOpacity 
            style={[
              styles.rideTypeTab, 
              rideTypeFilter === 'all' && styles.activeRideTypeTab
            ]}
            onPress={() => filterRidesByType('all')}
          >
            <Ionicons 
              name="list" 
              size={16} 
              color={rideTypeFilter === 'all' ? '#ffc107' : '#555'} 
            />
            <Text style={[
              styles.rideTypeText,
              rideTypeFilter === 'all' && styles.activeRideTypeText
            ]}>All Rides</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.rideTypeTab, 
              rideTypeFilter === 'my-rides' && styles.activeRideTypeTab
            ]}
            onPress={() => filterRidesByType('my-rides')}
          >
            <Ionicons 
              name="person" 
              size={16} 
              color={rideTypeFilter === 'my-rides' ? '#ffc107' : '#555'} 
            />
            <Text style={[
              styles.rideTypeText,
              rideTypeFilter === 'my-rides' && styles.activeRideTypeText
            ]}>My Rides</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.rideTypeTab, 
              rideTypeFilter === 'others' && styles.activeRideTypeTab
            ]}
            onPress={() => filterRidesByType('others')}
          >
            <Ionicons 
              name="people" 
              size={16} 
              color={rideTypeFilter === 'others' ? '#ffc107' : '#555'} 
            />
            <Text style={[
              styles.rideTypeText,
              rideTypeFilter === 'others' && styles.activeRideTypeText
            ]}>Others' Rides</Text>
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#ffc107" style={styles.loader} />
            <Text style={styles.loaderText}>Searching for rides...</Text>
          </View>
        ) : displayedRides.length === 0 ? (
          <View style={styles.noRides}>
            <Ionicons name="search-outline" size={50} color="#ccc" />
            <Text style={styles.noRidesTitle}>No rides found</Text>
            <Text style={styles.noRidesSubtitle}>Try adjusting your search criteria</Text>
          </View>
        ) : (
          <View style={styles.ridesList}>
            {displayedRides.map((item) => renderRideCard({ item }))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  logo: {
    width: 150,
    height: 100,
    resizeMode: 'contain',
  },
  headerButton: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 25,
    marginTop: 30,
  },
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  title: { 
    fontSize: 36, 
    color: '#333',
    fontFamily: 'outfit-bold'
  },
  subtitle: { 
    fontSize: 14, 
    color: '#777', 
    textAlign: 'center', 
    marginVertical: 10,
    maxWidth: '80%',
    fontFamily: 'outfit'
  },
  searchForm: {
    width: '100%',
    marginTop: 20,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
    fontFamily: 'outfit'
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
    flexDirection: 'row',
    alignItems: 'center',
    fontFamily: 'outfit-bold'
  },
  input: { 
    width: '100%', 
    borderColor: '#ddd', 
    borderWidth: 1, 
    borderRadius: 10, 
    padding: 15, 
    fontSize: 16,
    backgroundColor: '#fff',
    fontFamily: 'outfit'
  },
  searchButton: { 
    backgroundColor: '#ffc107',
    padding: 15, 
    borderRadius: 10, 
    width: '100%', 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    elevation: 2,
  },
  searchButtonText: { 
    fontSize: 18,
    color: '#333',
    fontFamily: 'outfit-bold'
  },
  filtersToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginTop: 15,
  },
  filtersToggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0066cc',
    marginRight: 5,
    fontFamily: 'outfit-bold'
  },
  notification: {
    padding: 15,
    borderRadius: 8,
    margin: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successNotification: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  infoNotification: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
  },
  errorNotification: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  notificationText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'outfit'
  },
  filtersContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 15,
    marginTop: 15,
    marginBottom: 15,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  filtersTitle: {
    fontSize: 20,
    fontFamily: 'outfit-bold'
  },
  resetText: {
    fontSize: 16,
    color: '#0066cc',
    fontFamily: 'outfit'
  },
  filterSection: {
    marginBottom: 20
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  },
  slider: {
    width: '100%',
    height: 40
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 10
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'outfit'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginTop: 5,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%'
  },
  ridesContainer: {
    marginTop: 15,
    marginBottom: 30,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 15,
  },
  ridesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  ridesTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ridesTitle: {
    fontSize: 22,
    fontFamily: 'outfit-bold'
  },
  rideCountBadge: {
    backgroundColor: '#ffc107',
    borderRadius: 15,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  rideCount: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'outfit-bold'
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearAllButton: {
    backgroundColor: '#f8d7da',
    padding: 8,
    borderRadius: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  clearAllText: {
    color: '#dc3545',
    fontFamily: 'outfit-bold'
  },
  loaderContainer: {
    alignItems: 'center',
    padding: 30,
  },
  loader: {
    marginBottom: 10,
  },
  loaderText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'outfit'
  },
  ridesList: {
    width: '100%',
  },
  noRides: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f5f5f9',
    borderRadius: 15,
  },
  noRidesTitle: {
    fontSize: 18,
    marginTop: 15,
    marginBottom: 5,
    fontFamily: 'outfit-bold'
  },
  noRidesSubtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center'
  },
  rideCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  fullyBookedCard: {
    opacity: 0.8,
    borderColor: '#ccc',
  },
  fullyBookedBanner: {
    position: 'absolute',
    top: 25,
    right: -35,
    backgroundColor: '#dc3545',
    paddingVertical: 5,
    paddingHorizontal: 35,
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
  },
  fullyBookedText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'outfit-bold'
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15,
  },
  rideInfo: {
    flex: 1,
  },
  vehicleModel: {
    fontSize: 18,
    marginBottom: 5,
    fontFamily: 'outfit-bold'
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleType: {
    color: '#777',
    fontSize: 14,
    textTransform: 'capitalize',
    marginLeft: 5,
    fontFamily: 'outfit'
  },
  price: {
    fontSize: 22,
    color: '#28a745',
    backgroundColor: '#e7f4e4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    fontFamily: 'outfit-bold'
  },
  rideDetails: {
    marginBottom: 15,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  detailIconContainer: {
    width: 25,
    alignItems: 'center',
  },
  detailNotes: {
    marginTop: 5,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailLabel: {
    width: 90,
    fontSize: 14,
    marginLeft: 5,
    fontFamily: 'outfit-bold'
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'outfit'
  },
  lowSeats: {
    color: '#dc3545',
    fontFamily: 'outfit-bold'
  },
  mediumSeats: {
    color: '#ffc107',
    fontFamily: 'outfit-bold'
  },
  highSeats: {
    color: '#28a745',
    fontFamily: 'outfit-bold'
  },
  rideFooter: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  bookButton: {
    backgroundColor: '#ffc107',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'outfit-bold'
  },
  cancelRideButton: {
    backgroundColor: '#f8d7da',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  cancelRideButtonText: {
    fontSize: 16,
    color: '#dc3545',
    fontFamily: 'outfit-bold'
  },
  quickSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  suggestionChip: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'outfit-bold'
  },
  dateSeatsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#f8d7da',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#dc3545',
    fontFamily: 'outfit-bold'
  },
  rideTypeTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    padding: 5,
  },
  rideTypeTab: {
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  activeRideTypeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  rideTypeText: {
    fontSize: 14,
    marginLeft: 5,
    color: '#555',
    fontFamily: 'outfit-bold'
  },
  activeRideTypeText: {
    color: '#ffc107',
    fontFamily: 'outfit-bold'
  },
  userRideCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#ffc107',
  },
  userRideBadge: {
    position: 'absolute',
    top: 10,
    left: 140,
    backgroundColor: '#ffc107',
    padding: 5,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRideText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 5,
    fontFamily: 'outfit-bold'
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginTop: 15,
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0066cc',
    marginRight: 5,
    fontFamily: 'outfit-bold'
  },
});

