import { View, Text, ScrollView, TouchableOpacity, Modal, Alert } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import userService from "../../services/user.service"; // You need to implement this service

const Admin = () => {
    const [isAdmin, setIsAdmin] = useState<boolean | undefined>(false);
    const [users, setUsers] = useState<any[]>([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    useEffect(() => {
        interface DecodedToken {
            [key: string]: any;
            "cognito:groups"?: string[];
            "username": string;
        }

        const checkAdminAndFetchUsers = async () => {
            const token = await SecureStore.getItemAsync("accessToken");
            const decoded = jwtDecode<DecodedToken>(token || "");
            const groups = decoded["cognito:groups"];
            setIsAdmin(groups?.includes("ADMIN"));

            if (groups?.includes("ADMIN")) {
                try {
                    const result = await userService.getAllUser();
                    if (result.statusCode === 200) {
                        setUsers(result.data);
                    } else {
                        Alert.alert("Error", "Failed to fetch users");
                    }
                } catch (error) {
                    Alert.alert("Error", "Failed to fetch users");
                }
            }
        };

        checkAdminAndFetchUsers();
    }, []);

    const handleDelete = async (userId: string) => {
        try {
            setUsers(users.filter((u) => u.id !== userId));
            setShowConfirm(false);
            setSelectedUser(null);
            //   const result = await userService.deleteUser(userId);
            //   if (result.statusCode === 200) {
            //     setUsers(users.filter((u) => u.id !== userId));
            //     setShowConfirm(false);
            //     setSelectedUser(null);
            //   } else {
            //     Alert.alert("Error", "Failed to delete user");
            //   }
        } catch (error) {
            Alert.alert("Error", "Failed to delete user");
        }
    };

    if (!isAdmin) {
        return (
            <SafeAreaView style={{ flex: 1, paddingBottom: 70 }}>
                <Text style={{ padding: 20, color: "red", fontWeight: "bold" }}>
                    You do not have permission to view this page.
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{
            flex: 1,
            paddingBottom: 80,
        }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", margin: 20 }}>User Management</Text>
            <ScrollView >
                <ScrollView horizontal >
                    <View>
                        {/* Table Header */}
                        <View style={{ flexDirection: "row", backgroundColor: "#eee", padding: 10 }}>
                            <Text style={{ width: 60, fontWeight: "bold" }}>#</Text>
                            <Text style={{ width: 120, fontWeight: "bold" }}>First Name</Text>
                            <Text style={{ width: 120, fontWeight: "bold" }}>Last Name</Text>
                            <Text style={{ width: 180, fontWeight: "bold" }}>Email</Text>
                            <Text style={{ width: 100, fontWeight: "bold" }}>Role</Text>
                            <Text style={{ width: 80, fontWeight: "bold" }}>Action</Text>
                        </View>
                        {/* Table Rows */}
                        {users.map((user, idx) => (
                            <View
                                key={user.id}
                                style={{
                                    flexDirection: "row",
                                    borderBottomWidth: 1,
                                    borderColor: "#eee",
                                    padding: 10,
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ width: 60 }}>{idx + 1}</Text>
                                <Text style={{ width: 120 }}>{user.firstName}</Text>
                                <Text style={{ width: 120 }}>{user.lastName}</Text>
                                <Text style={{ width: 180 }}>{user.email}</Text>
                                <Text style={{ width: 100 }}>{user.role}</Text>
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: "#FF4D4F",
                                        paddingHorizontal: 10,
                                        paddingVertical: 5,
                                        borderRadius: 5,
                                    }}
                                    onPress={() => {
                                        setSelectedUser(user);
                                        setShowConfirm(true);
                                    }}
                                >
                                    <Text style={{ color: "#fff" }}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </ScrollView>


            {/* Confirm Delete Modal */}
            <Modal
                visible={showConfirm}
                transparent
                animationType="fade"
                onRequestClose={() => setShowConfirm(false)}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.3)",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <View
                        style={{
                            backgroundColor: "#fff",
                            padding: 24,
                            borderRadius: 10,
                            width: 300,
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
                            Confirm Delete
                        </Text>
                        <Text>
                            Are you sure you want to delete user{" "}
                            <Text style={{ fontWeight: "bold" }}>
                                {selectedUser?.userName || selectedUser?.username || selectedUser?.email}
                            </Text>
                            ?
                        </Text>
                        <View style={{ flexDirection: "row", marginTop: 20, gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => setShowConfirm(false)}
                                style={{
                                    paddingHorizontal: 20,
                                    paddingVertical: 8,
                                    backgroundColor: "#eee",
                                    borderRadius: 8,
                                    marginRight: 10,
                                }}
                            >
                                <Text>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleDelete(selectedUser.id)}
                                style={{
                                    paddingHorizontal: 20,
                                    paddingVertical: 8,
                                    backgroundColor: "#FF4D4F",
                                    borderRadius: 8,
                                }}
                            >
                                <Text style={{ color: "#fff", fontWeight: "bold" }}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default Admin;