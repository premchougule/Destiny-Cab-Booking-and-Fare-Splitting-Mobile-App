import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    ActivityIndicator,
    FlatList,
    useWindowDimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function Profile(){
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const isTablet = width > 768;
    const scale = Math.min(width, height) / 375;
    const dynamicFontScale = Math.min(scale, 1.4);

    const [userData, setUserData] = useState({
        fullName: "Loading...",
        email: "Loading..."
    });
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBookingsLoading, setIsBookingsLoading] = useState(true);

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

    useEffect(() => {
        // Load user data when component mounts
        loadUserData();
        loadBookings();
    }, []);

    const loadUserData = async () => {
        try {
            // Try to get the stored user data
            const userDataString = await AsyncStorage.getItem('userData');
            
            if (userDataString) {
                // User data exists in storage
                const storedUserData = JSON.parse(userDataString);
                setUserData(storedUserData);
            } else {
                // No user data found in storage
                setUserData({
                    fullName: "Guest User",
                    email: "Not signed in"
                });
            }
        } catch (error) {
            console.error("Failed to load user data:", error);
            Alert.alert("Error", "Failed to load profile information");
        } finally {
            setIsLoading(false);
        }
    };

    const loadBookings = async () => {
        try {
            setIsBookingsLoading(true);
            // Get bookings from AsyncStorage
            const bookingsString = await AsyncStorage.getItem('bookings');
            if (bookingsString) {
                const storedBookings = JSON.parse(bookingsString);
                
                // Filter bookings for current user
                const userDataString = await AsyncStorage.getItem('userData');
                if (userDataString) {
                    const userData = JSON.parse(userDataString);
                    // Show only active bookings for this user
                    const userBookings = storedBookings.filter(
                        booking => booking.userId === userData.email && booking.status === 'confirmed'
                    );
                    setBookings(userBookings);
                }
            } else {
                setBookings([]);
            }
        } catch (error) {
            console.error("Failed to load bookings:", error);
            Alert.alert("Error", "Failed to load booking information");
        } finally {
            setIsBookingsLoading(false);
        }
    };

    const cancelBooking = async (bookingId) => {
        try {
            setIsBookingsLoading(true);
            
            // Get all bookings
            const bookingsString = await AsyncStorage.getItem('bookings');
            if (!bookingsString) {
                Alert.alert("Error", "Booking information not found");
                return;
            }
            
            const allBookings = JSON.parse(bookingsString);
            
            // Find the booking to cancel
            const bookingIndex = allBookings.findIndex(b => b.id === bookingId);
            if (bookingIndex === -1) {
                Alert.alert("Error", "Booking not found");
                return;
            }
            
            const booking = allBookings[bookingIndex];
            const rideId = booking.rideId;
            
            // Update booking status
            booking.status = 'cancelled';
            allBookings[bookingIndex] = booking;
            
            // Update ride seats (increment available seats)
            const ridesString = await AsyncStorage.getItem('rides');
            if (ridesString) {
                const allRides = JSON.parse(ridesString);
                const rideIndex = allRides.findIndex(r => r.id === rideId);
                
                if (rideIndex !== -1) {
                    // Increase available seats
                    allRides[rideIndex].seats += 1;
                    
                    // If the ride was fully booked, update status
                    if (allRides[rideIndex].status === 'booked') {
                        allRides[rideIndex].status = 'active';
                    }
                    
                    // Save updated rides
                    await AsyncStorage.setItem('rides', JSON.stringify(allRides));
                }
            }
            
            // Save updated bookings
            await AsyncStorage.setItem('bookings', JSON.stringify(allBookings));
            
            // Refresh bookings list
            loadBookings();
            
            // Show success message
            Alert.alert("Success", "Your booking has been cancelled successfully");
            
        } catch (error) {
            console.error("Failed to cancel booking:", error);
            Alert.alert("Error", "Failed to cancel booking");
        } finally {
            setIsBookingsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            // Clear user data from storage
            await AsyncStorage.removeItem('userData');
            // Navigate back to the sign-in screen
            router.replace('/');
        } catch (error) {
            console.error("Failed to logout:", error);
            Alert.alert("Error", "Failed to log out");
        }
    };

    const renderBookingItem = ({ item }) => {
        const { formattedDate, formattedTime } = formatDateTime(item.rideDetails.departureTime);
        
        return (
            <View style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                    <Text style={styles.bookingTitle}>
                        {item.rideDetails.pickup} to {item.rideDetails.destination}
                    </Text>
                    <View style={styles.bookingStatus}>
                        <Text style={styles.statusText}>Confirmed</Text>
                    </View>
                </View>
                
                <View style={styles.bookingDetails}>
                    <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                            <Ionicons name="car" size={18} color="#555" />
                        </View>
                        <Text style={styles.detailLabel}>Vehicle:</Text>
                        <Text style={styles.detailValue}>
                            {item.rideDetails.vehicle} ({item.rideDetails.type})
                        </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                            <Ionicons name="person" size={18} color="#555" />
                        </View>
                        <Text style={styles.detailLabel}>Driver:</Text>
                        <Text style={styles.detailValue}>{item.rideDetails.driver}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                            <Ionicons name="calendar" size={18} color="#555" />
                        </View>
                        <Text style={styles.detailLabel}>Date:</Text>
                        <Text style={styles.detailValue}>{formattedDate}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                            <Ionicons name="time" size={18} color="#555" />
                        </View>
                        <Text style={styles.detailLabel}>Time:</Text>
                        <Text style={styles.detailValue}>{formattedTime}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                            <Ionicons name="cash" size={18} color="#555" />
                        </View>
                        <Text style={styles.detailLabel}>Price:</Text>
                        <Text style={[styles.detailValue, styles.priceText]}>₹{item.rideDetails.price}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                            <Ionicons name="time" size={18} color="#555" />
                        </View>
                        <Text style={styles.detailLabel}>Booked:</Text>
                        <Text style={styles.detailValue}>
                            {new Date(item.bookedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                            })}
                        </Text>
                    </View>
                </View>
                
                <View style={styles.bookingFooter}>
                    <TouchableOpacity 
                        style={styles.contactButton}
                        onPress={() => Alert.alert("Contact Info", `Driver: ${item.rideDetails.driver}\nEmail: ${item.rideDetails.driverEmail}`)}
                    >
                        <Text style={styles.contactButtonText}>Contact Driver</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => {
                            Alert.alert(
                                "Cancel Booking",
                                "Are you sure you want to cancel this booking?",
                                [
                                    {
                                        text: "No",
                                        style: "cancel"
                                    },
                                    {
                                        text: "Yes",
                                        style: "destructive",
                                        onPress: () => cancelBooking(item.id)
                                    }
                                ]
                            );
                        }}
                    >
                        <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const styles = StyleSheet.create({
        wrapper: {
            flex: 1,
            backgroundColor: '#fff',
            padding: width * 0.04
        },
        navbar: {
            paddingTop: 40,
            paddingBottom: 20,
            paddingHorizontal: width * 0.05,
            backgroundColor: '#fff',
            borderBottomWidth: 1,
            borderColor: '#ddd',
        },
        logo: {
            width: width * 0.4,
            maxWidth: 180,
            height: 120,
            resizeMode: 'contain',
            marginBottom: 1,
        },
        bookButton: {
            backgroundColor: '#ffc107',
            borderRadius: 20,
            paddingVertical: height * 0.01,
            paddingHorizontal: width * 0.04,
            marginLeft: 'auto',
            marginTop: -60,
        },
        bookButtonText: {
            fontSize: Math.min(width * 0.04 * dynamicFontScale, 16),
            fontFamily: 'outfit-bold'
        },
        profile: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: height * 0.04
        },
        avatar: { 
            width: Math.min(width * 0.5, 200),
            height: Math.min(width * 0.5, 200),
            borderRadius: Math.min(width * 0.25, 100),
            marginBottom: height * 0.02,
            borderWidth: 2,
            resizeMode: 'cover',
        },
        name: { 
            fontSize: Math.min(width * 0.06 * dynamicFontScale, 22),
            fontFamily: 'outfit-bold'
        },
        email: { 
            fontSize: Math.min(width * 0.04 * dynamicFontScale, 16),
            color: '#777', 
            marginBottom: height * 0.03,
            fontFamily: 'outfit-bold'
        },
        actions: { 
            width: '100%',
            maxWidth: isTablet ? 600 : '100%',
            gap: height * 0.02,
            padding: width * 0.05,
            fontSize: Math.min(width * 0.04 * dynamicFontScale, 16),
            fontFamily: 'outfit-bold'
        },
        button: {
            backgroundColor: '#ffc107',
            padding: height * 0.015,
            borderRadius: 8,
            alignItems: 'center',
        },
        bookingsContainer: {
            marginTop: height * 0.03,
            backgroundColor: '#f9f9f9',
            borderRadius: 15,
            padding: width * 0.04,
            marginBottom: height * 0.04,
            width: '100%',
            maxWidth: isTablet ? 800 : '100%',
            alignSelf: 'center',
        },
        bookingsHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: '#eee',
            paddingBottom: 15,
            marginBottom: 15,
        },
        bookingsTitle: {
            fontSize: 24,
            color: '#333',
            fontFamily: 'outfit-bold'
        },
        refreshButton: {
            padding: 8,
            borderRadius: 20,
            backgroundColor: '#f0f0f0',
        },
        loadingContainer: {
            padding: 30,
            alignItems: 'center',
        },
        loadingText: {
            marginTop: 10,
            fontSize: 16,
            color: '#666',
            fontFamily: 'outfit'
        },
        emptyBookings: {
            alignItems: 'center',
            padding: 40,
        },
        emptyTitle: {
            fontSize: 18,
            marginTop: 15,
            marginBottom: 5,
            fontFamily: 'outfit-bold'
        },
        emptySubtitle: {
            fontSize: 14,
            color: '#777',
            textAlign: 'center',
            marginBottom: 20,
            fontFamily: 'outfit'
        },
        findRideButton: {
            backgroundColor: '#ffc107',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 10,
        },
        findRideButtonText: {
            fontSize: 16,
            fontFamily: 'outfit-bold'
        },
        bookingsList: {
            paddingBottom: 20,
        },
        bookingCard: {
            backgroundColor: 'white',
            borderRadius: 15,
            padding: 15,
            marginBottom: 15,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            borderWidth: 1,
            borderColor: '#eee',
        },
        bookingHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15,
            borderBottomWidth: 1,
            borderBottomColor: '#f0f0f0',
            paddingBottom: 15,
        },
        bookingTitle: {
            fontSize: 18,
            flex: 1,
            fontFamily: 'outfit-bold'
        },
        bookingStatus: {
            backgroundColor: '#e7f4e4',
            paddingVertical: 5,
            paddingHorizontal: 10,
            borderRadius: 5,
        },
        statusText: {
            color: '#28a745',
            fontSize: 14,
            fontFamily: 'outfit-bold'
        },
        bookingDetails: {
            marginBottom: 15,
        },
        detailRow: {
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
        detailLabel: {
            width: 70,
            fontSize: 14,
            marginLeft: 5,
            fontFamily: 'outfit-bold'
        },
        detailValue: {
            flex: 1,
            fontSize: 14,
            fontFamily: 'outfit'
        },
        priceText: {
            color: '#28a745',
            fontSize: 16,
            fontFamily: 'outfit-bold'
        },
        bookingFooter: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            borderTopWidth: 1,
            borderTopColor: '#eee',
            paddingTop: 15,
        },
        contactButton: {
            backgroundColor: '#0066cc',
            paddingVertical: 8,
            paddingHorizontal: 15,
            borderRadius: 8,
            flex: 1,
            marginRight: 10,
            alignItems: 'center',
        },
        contactButtonText: {
            color: 'white',
            fontFamily: 'outfit-bold'
        },
        cancelButton: {
            borderWidth: 1,
            borderColor: '#dc3545',
            paddingVertical: 8,
            paddingHorizontal: 15,
            borderRadius: 8,
            alignItems: 'center',
        },
        cancelButtonText: {
             color: '#dc3545',
            fontFamily: 'outfit-bold'
        },
    });

    return(
         <ScrollView style={styles.wrapper}>
            {/* Header/Navbar */}
            <View style={styles.navbar}>
                <Image source={require('./../../assets/images/logo.png')} style={styles.logo} />
                <View style={styles.navLinks}>
                    <TouchableOpacity style={styles.bookButton} onPress={handleLogout}>
                        <Text style={styles.bookButtonText}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
            
            <View style={styles.profile}>
                <Image style={styles.avatar}
                    source={require('./../../assets/images/profile.png')}
                />
                <Text style={styles.name}>{userData.fullName}</Text>
                <Text style={styles.email}>{userData.email}</Text>
            </View> 
            
            <View style={styles.actions}>
                <TouchableOpacity style={styles.button}><Text style={{fontFamily: 'outfit'}}>Edit Profile</Text></TouchableOpacity>
                <TouchableOpacity style={styles.button}><Text style={{fontFamily: 'outfit'}}>Ride History</Text></TouchableOpacity>
                <TouchableOpacity style={styles.button}><Text style={{fontFamily: 'outfit'}}>Payment</Text></TouchableOpacity>
            </View>
            
            <View style={styles.bookingsContainer}>
                <View style={styles.bookingsHeader}>
                    <Text style={styles.bookingsTitle}>My Active Rides</Text>
                    <TouchableOpacity 
                        style={styles.refreshButton}
                        onPress={loadBookings}
                    >
                        <Ionicons name="refresh" size={18} color="#555" />
                    </TouchableOpacity>
                </View>
                
                {isBookingsLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#ffc107" />
                        <Text style={styles.loadingText}>Loading your bookings...</Text>
                    </View>
                ) : bookings.length === 0 ? (
                    <View style={styles.emptyBookings}>
                        <Ionicons name="car-outline" size={60} color="#ddd" />
                        <Text style={styles.emptyTitle}>No Active Rides</Text>
                        <Text style={styles.emptySubtitle}>You don't have any active ride bookings</Text>
                        <TouchableOpacity 
                            style={styles.findRideButton}
                            onPress={() => router.push('/(tabs)/search')}
                        >
                            <Text style={styles.findRideButtonText}>Find a Ride</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={bookings}
                        renderItem={renderBookingItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.bookingsList}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={false}
                    />
                )}
            </View>
        </ScrollView>
    )
}