import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
    return(
        <Tabs screenOptions={{headerShown:false}}>
            <Tabs.Screen name="home" 
            options={{
                tabBarIcon:({coloe,size})=><FontAwesome5 name="car" size={24} color="black" />
            }}
            />
            <Tabs.Screen name="search" 
            options={{
                tabBarIcon:({color,size})=><FontAwesome5 name="search" size={24} color="black" />
            }}
            />
            <Tabs.Screen name="share" 
             options={{
                tabBarIcon:({color,size})=><FontAwesome6 name="user-group" size={24} color="black" />
            }}
            />
            <Tabs.Screen name="profile"
             options={{
                tabBarIcon:({color,size})=><Ionicons name="person-circle-outline" size={24} color="black" />
            }}
            />
        </Tabs>
    )
}