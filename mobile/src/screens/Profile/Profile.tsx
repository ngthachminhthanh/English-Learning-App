import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Keyboard,
  Alert,
  Image,
} from "react-native";
import { Avatar, Icon } from "react-native-elements";
import InputField from "./InputField";
import userService from "../../services/user.service";
import MainHeader from "../../components/MainHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import authService from "../../services/auth.service";
import { useNavigation } from "@react-navigation/native";
import { LoginScreenNavigationProp } from "../../type";
import * as SecureStore from "expo-secure-store";
import { User } from "../../models";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { uploadFile } from "../../utils/upload.util";
import { ScrollView } from "react-native-gesture-handler";


const Profile = () => {
  const [profile, setProfile] = useState<User>({
    id: "",
    createDate: "",
    updateDate: "",
    role: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: new Date(),
    avatarURL: "",
    awsCognitoId: "",
    additionalInfo: {
      schoolName: "",
    },
  });
  const [loading, setLoading] = useState(true);
  const [isImageValid, setIsImageValid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [isModified, setIsModified] = useState(false); // Track manual changes

  const navigation = useNavigation<LoginScreenNavigationProp>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const acessToken = await SecureStore.getItemAsync("accessToken")
        console.log("acessToken on Profile",acessToken);
        
        const result = await userService.getUser();
        console.log("result", result);
        
        if (result.statusCode === 200 && !isModified) {
          setProfile(result.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // Empty dependency array to run only on mount

  const handleInputChange = (field: keyof User, value: string) => {
    setIsModified(true); // Mark profile as modified
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const pickFile = async () => {
    try {
      setErrorMessage("");
      setIsImageValid(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFileUrl(asset.uri);
        console.log("uri:", asset.uri);

        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        console.log("File info:", fileInfo);
        if (!fileInfo.exists || fileInfo.size === 0) {
          throw new Error("File does not exist or is empty");
        }
        if (fileInfo.size < 1000) {
          throw new Error(`File size too small (${fileInfo.size} bytes), likely corrupted`);
        }

        // Validate MIME type
        const extension = asset.name?.split(".").pop()?.toLowerCase() || "";
        const contentTypeMap = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
        };
        const mimeType =
          (extension in contentTypeMap
            ? contentTypeMap[extension as keyof typeof contentTypeMap]
            : undefined) ||
          asset.mimeType ||
          "application/octet-stream";
        if (!mimeType.startsWith("image/")) {
          throw new Error(`Invalid MIME type: ${mimeType}`);
        }

        // Optional JPEG header validation
        if (mimeType === "image/jpeg") {
          try {
            const fileContent = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.Base64,
              length: 2,
            });
            const binaryString = atob(fileContent);
            const bytes = new Uint8Array(binaryString.split("").map((c) => c.charCodeAt(0)));
            if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
              throw new Error("Invalid JPEG file: Missing SOI marker");
            }
            console.log("JPEG header validated successfully");
          } catch (validationError) {
            console.warn("JPEG validation failed, proceeding anyway:", validationError);
          }
        }

        // Upload file to S3
        const key = await uploadFile(asset.uri, asset.name || "image.jpg", mimeType, "profile image file");
        const cloudfrontUrl = `https://d1fc7d6en42vzg.cloudfront.net/${key}`;
        console.log("S3 key:", key);

        // Update user profile
        const updateResponse = await userService.updateUser({
          avatarURL: cloudfrontUrl,
        });
        if (updateResponse.statusCode !== 200 && updateResponse.statusCode !== 201) {
          throw new Error(`Failed to update user profile, status: ${updateResponse.statusCode}`);
        }

        setFileUrl(cloudfrontUrl);
        setProfile((prev) => ({
          ...prev,
          avatarURL: cloudfrontUrl,
        }));
        setIsImageValid(true);
        setIsModified(true);
        Alert.alert("Success", "Image uploaded successfully");
      } else {
        Alert.alert("No file selected", "Please select a file to upload.");
      }
    } catch (err) {
      console.error("File pick or upload error:", err);
      setIsImageValid(false);
      setErrorMessage("File is corrupted or invalid, please select another");
      Alert.alert("Error", "Failed to upload file. Please try again.");
    }
  };

  const handleUpdateProfile = async (profile: User) => {
    try {
      const result = await userService.updateUser({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        birthDate: profile.birthDate,
        avatarURL: profile.avatarURL,
      });
      if (result.statusCode === 200 || result.statusCode === 201) {
        Alert.alert("Success", "Profile updated successfully");
        setIsModified(false); // Reset modified flag after successful update
      } else {
        throw new Error(`Failed to update profile, status: ${result.statusCode}`);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "An error occurred while updating the profile.");
    }
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      await authService.signOut()
      const acessTokenOnSignOut = SecureStore.getItemAsync("accessToken")
      console.log("access token on sign out ", acessTokenOnSignOut);
      
      navigation.navigate("Login");
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <MainHeader />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, alignItems: "center", padding: 20 }}>
          <Avatar
            source={
              profile.avatarURL
                ? { uri: profile.avatarURL }
                : require("../../../assets/avatar.jpg")
            }
            size="xlarge"
            rounded
            containerStyle={{ marginTop: 20, marginBottom: 10 }}
            onPress={pickFile}
          />
          <TouchableOpacity onPress={pickFile}>
            <Text style={{ color: "#5D5FEF", fontWeight: "bold", marginBottom: 20 }}>
              Change Image
            </Text>
          </TouchableOpacity>
          {errorMessage ? (
            <Text style={{ color: "red", marginBottom: 10 }}>{errorMessage}</Text>
          ) : null}
          <ScrollView style={{ width: "90%", marginBottom: 20 }}>
            <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 8 }}>
              Birth Date
            </Text>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 15,
                padding: 12,
                borderWidth: 1,
                borderColor: "#ccc",
              }}
            >
              <Text style={{ fontSize: 16, color: "#333" }}>
                {new Date(profile.birthDate).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
          </ScrollView>
          <InputField
            key="firstName"
            label="First Name"
            value={profile.firstName}
            onChangeText={(value) => handleInputChange("firstName", value)}
          />
          <InputField
            key="lastName"
            label="Last Name"
            value={profile.lastName}
            onChangeText={(value) => handleInputChange("lastName", value)}
          />
          <InputField
            key="email"
            label="Email"
            value={profile.email}
            onChangeText={(value) => handleInputChange("email", value)}

          />
          <InputField
            key="phone"
            label="Phone Number"
            value={profile.phone}
            onChangeText={(value) => handleInputChange("phone", value)}

          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 20,
              marginTop: 20,
            }}
          >
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#5D5FEF",
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 16,
              }}
              onPress={() => handleUpdateProfile(profile)}
            >
              <Icon
                name="checkbox-marked-outline"
                type="material-community"
                color="white"
                size={25}
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: "white", fontWeight: "bold" }}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#EF5DA8",
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 16,
              }}
              onPress={handleLogout}
            >
              <Icon
                name="logout"
                type="material-community"
                color="white"
                size={25}
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: "white", fontWeight: "bold" }}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default Profile;