import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    Platform,
    useWindowDimensions,
    StatusBar,
    KeyboardAvoidingView,
    ScrollView,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignUp() {
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Calculate dynamic scales based on screen size
    const isSmallDevice = width < 375;
    const isTablet = width > 768;
    const scale = Math.min(width, height) / 375; // Base scale on iPhone 8 dimensions
    const dynamicFontScale = Math.min(scale, 1.4); // Cap font scaling

    const validate = () => {
        let tempErrors = {};
        if (!fullName) tempErrors.fullName = "Full name is required";
        if (!email) tempErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(email)) tempErrors.email = "Email is invalid";
        if (!password) tempErrors.password = "Password is required";
        else if (password.length < 6) tempErrors.password = "Password must be at least 6 characters";
        
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSignUp = async () => {
        if (validate()) {
            setIsLoading(true);
            try {
                const usersString = await AsyncStorage.getItem('users');
                const users = usersString ? JSON.parse(usersString) : [];
                
                if (users.some(user => user.email.toLowerCase() === email.toLowerCase())) {
                    Alert.alert(
                        "Email Already Exists", 
                        "An account with this email already exists. Please sign in instead.",
                        [
                            { text: "OK" },
                            { 
                                text: "Go to Sign In", 
                                onPress: () => router.push('/auth/SignIn') 
                            }
                        ]
                    );
                    return;
                }
                
                const newUser = {
                    id: Date.now().toString(),
                    fullName: fullName,
                    email: email,
                    password: password,
                    createdAt: new Date().toISOString()
                };
                
                users.push(newUser);
                await AsyncStorage.setItem('users', JSON.stringify(users));
                
                const userData = {
                    fullName: fullName,
                    email: email,
                };
                
                await AsyncStorage.setItem('userData', JSON.stringify(userData));
                
                Alert.alert(
                    "Success", 
                    "Your account has been created successfully!",
                    [
                        { 
                            text: "Continue", 
                            onPress: () => router.push('/(tabs)/home') 
                        }
                    ]
                );
            } catch (error) {
                console.error("Sign Up Error:", error);
                Alert.alert("Sign Up Failed", "Something went wrong. Please try again.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: 'white',
        },
        safeArea: {
            flex: 1,
        },
        scrollView: {
            flexGrow: 1,
        },
        contentContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: width * 0.06,
            paddingTop: Platform.select({
                ios: height * 0.02,
                android: height * 0.02 + StatusBar.currentHeight,
            }),
            paddingBottom: height * 0.03,
        },
        logoContainer: {
            width: isTablet ? width * 0.3 : width * 0.5,
            height: isTablet ? height * 0.15 : height * 0.12,
            marginBottom: height * 0.02,
            alignItems: 'center',
            justifyContent: 'center',
        },
        logo: {
            width: '100%',
            height: '100%',
            resizeMode: 'contain',
        },
        titleContainer: {
            marginBottom: height * 0.04,
            alignItems: 'center',
        },
        title: {
            fontSize: isTablet ? width * 0.05 : width * 0.08 * dynamicFontScale,
            fontFamily: 'outfit-bold',
            textAlign: 'center',
            color: '#000000',
            lineHeight: Platform.select({
                ios: width * 0.1,
                android: width * 0.12,
            }),
        },
        inputContainer: {
            width: '100%',
            maxWidth: isTablet ? 500 : '100%',
            marginBottom: height * 0.02,
        },
        textInput: {
            borderWidth: 1,
            borderColor: '#E0E0E0',
            width: '100%',
            padding: width * 0.04,
            fontSize: isTablet ? width * 0.02 : width * 0.045 * dynamicFontScale,
            marginTop: height * 0.02,
            borderRadius: 12,
            height: Platform.select({
                ios: height * 0.06,
                android: height * 0.07,
            }),
            fontFamily: 'outfit',
            backgroundColor: '#FFFFFF',
        },
        inputError: {
            borderColor: '#FF3B30',
        },
        errorText: {
            color: '#FF3B30',
            fontSize: isTablet ? width * 0.015 : width * 0.035 * dynamicFontScale,
            marginTop: height * 0.01,
            fontFamily: 'outfit',
            alignSelf: 'flex-start',
        },
        createButton: {
            width: '100%',
            maxWidth: isTablet ? 500 : '100%',
            backgroundColor: '#ffc107',
            padding: height * 0.02,
            borderRadius: 12,
            marginTop: height * 0.03,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
        },
        createButtonText: {
            fontSize: isTablet ? width * 0.025 : width * 0.05 * dynamicFontScale,
            textAlign: 'center',
            fontFamily: 'outfit',
            color: '#000000',
        },
        disabledButton: {
            opacity: 0.7,
        },
        bottomContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: height * 0.03,
            gap: width * 0.02,
        },
        bottomText: {
            fontSize: isTablet ? width * 0.018 : width * 0.04 * dynamicFontScale,
            fontFamily: 'outfit',
            color: '#000000',
        },
        signInText: {
            fontSize: isTablet ? width * 0.018 : width * 0.04 * dynamicFontScale,
            color: '#007AFF',
            fontFamily: 'outfit-bold',
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.safeArea}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollView}
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.contentContainer}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('./../../assets/images/logo.png')}
                                style={styles.logo}
                            />
                        </View>

                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>Create an</Text>
                            <Text style={styles.title}>Account</Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <TextInput 
                                placeholder="Full Name"
                                style={[styles.textInput, errors.fullName && styles.inputError]}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholderTextColor="#999999"
                            />
                            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

                            <TextInput 
                                placeholder="Email"
                                style={[styles.textInput, errors.email && styles.inputError]}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#999999"
                            />
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                            <TextInput 
                                placeholder="Password"
                                secureTextEntry={true}
                                style={[styles.textInput, errors.password && styles.inputError]}
                                value={password}
                                onChangeText={setPassword}
                                placeholderTextColor="#999999"
                            />
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>

                        <TouchableOpacity
                            style={[styles.createButton, isLoading && styles.disabledButton]}
                            onPress={handleSignUp}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#000000" />
                            ) : (
                                <Text style={styles.createButtonText}>Create Account</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.bottomContainer}>
                            <Text style={styles.bottomText}>Already have an account?</Text>
                            <Pressable onPress={() => router.push('/auth/SignIn')}>
                                <Text style={styles.signInText}>Sign In here</Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}