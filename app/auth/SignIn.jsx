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
    StatusBar
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignIn() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        let tempErrors = {};
        if (!email) tempErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(email)) tempErrors.email = "Email is invalid";
        if (!password) tempErrors.password = "Password is required";
        
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSignIn = async () => {
        if (validate()) {
            setIsLoading(true);
            try {
                const usersString = await AsyncStorage.getItem('users');
                const users = usersString ? JSON.parse(usersString) : [];
                const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
                
                if (!user) {
                    Alert.alert("Sign In Failed", "No account found with this email. Please sign up first.");
                    return;
                }
                
                if (user.password !== password) {
                    Alert.alert("Sign In Failed", "Incorrect password. Please try again.");
                    return;
                }
                
                const userData = {
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone || '',
                };
                
                await AsyncStorage.setItem('userData', JSON.stringify(userData));
                router.push('/(tabs)/home');
            } catch (error) {
                console.error("Sign In Error:", error);
                Alert.alert("Sign In Failed", "Something went wrong. Please try again.");
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
        contentContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: Platform.select({
                ios: 20,
                android: StatusBar.currentHeight + 20,
            }),
            paddingBottom: 30,
        },
        logoContainer: {
            width: 200,
            height: 120,
            marginBottom: 20,
            alignItems: 'center',
            justifyContent: 'center',
        },
        logo: {
            width: '100%',
            height: '100%',
            resizeMode: 'contain',
        },
        titleContainer: {
            marginBottom: 40,
            alignItems: 'center',
        },
        title: {
            fontSize: 32,
            fontFamily: 'outfit-bold',
            textAlign: 'center',
            color: '#000000',
        },
        inputContainer: {
            width: '100%',
            marginBottom: 20,
        },
        textInput: {
            borderWidth: 1,
            borderColor: '#E0E0E0',
            width: '100%',
            padding: 15,
            fontSize: 16,
            marginTop: 20,
            borderRadius: 12,
            height: Platform.select({
                ios: 50,
                android: 60,
            }),
            fontFamily: 'outfit',
            backgroundColor: '#FFFFFF',
        },
        inputError: {
            borderColor: '#FF3B30',
        },
        errorText: {
            color: '#FF3B30',
            fontSize: 14,
            marginTop: 5,
            fontFamily: 'outfit',
        },
        signInButton: {
            width: '100%',
            backgroundColor: '#ffc107',
            padding: 15,
            borderRadius: 12,
            marginTop: 30,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
        },
        signInButtonText: {
            fontSize: 18,
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
            marginTop: 30,
            gap: 8,
        },
        bottomText: {
            fontSize: 16,
            fontFamily: 'outfit',
            color: '#000000',
        },
        signUpText: {
            fontSize: 16,
            color: '#007AFF',
            fontFamily: 'outfit-bold',
        },
        forgotPassword: {
            marginTop: 20,
        },
        forgotPasswordText: {
            fontSize: 14,
            color: '#0066cc',
            fontFamily: 'outfit',
            textAlign: 'center',
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.contentContainer}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('./../../assets/images/logo.png')}
                        style={styles.logo}
                    />
                </View>

                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Sign In to</Text>
                    <Text style={styles.title}>Your Account</Text>
                </View>

                <View style={styles.inputContainer}>
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
                </View>

                <View style={styles.inputContainer}>
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
                    style={[styles.signInButton, isLoading && styles.disabledButton]}
                    onPress={handleSignIn}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#000000" />
                    ) : (
                        <Text style={styles.signInButtonText}>Sign In</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.bottomContainer}>
                    <Text style={styles.bottomText}>Don't have an account?</Text>
                    <Pressable onPress={() => router.push('/auth/SignUp')}>
                        <Text style={styles.signUpText}>Sign Up here</Text>
                    </Pressable>
                </View>

                <TouchableOpacity
                    style={styles.forgotPassword}
                    onPress={() => router.push('/auth/SignUp')}
                    activeOpacity={0.6}
                >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}