import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Keyboard,
  Alert,
  Image
} from "react-native";
import { Avatar, Icon } from "react-native-elements";
import InputField from "./InputField";
import userService from "../../services/user.service";
import MainHeader from "../../components/MainHeader";
import { SafeAreaView } from "react-native-safe-area-context";
// import DateTimePicker, {
//   DateTimePickerEvent,
// } from "@react-native-community/datetimepicker";
import authService from "../../services/auth.service";
import { useNavigation } from "@react-navigation/native";
import { LoginScreenNavigationProp } from "../../type";
import * as SecureStore from "expo-secure-store";
import { User } from "../../models";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { uploadFile } from "../../utils/upload.util";
import * as DocumentPicker from 'expo-document-picker'

const Profile = () => {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [selectedFileUrl, setSelectedFileUrl] = useState<any>(null);

  const [profile, setProfile] = useState({
    id: "",
    createDate: "",
    updateDate: "",
    role: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: "",
    avatarURL: "",
    awsCognitoId: "",
    additionalInfo: {
      schoolName: "",
    },
  });
  const handleInputChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };
  // const [show, setShow] = useState(false);
  // const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
  //   setShow(false);
  //   if (selectedDate) {
  //     setProfile((prev) => ({
  //       ...prev,
  //       birthDate: selectedDate.toISOString(),
  //     }));
  //   }
  // };

  const loginNav = useNavigation<LoginScreenNavigationProp>();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await userService.getUser();
        if (result.statusCode === 200) {
          setProfile(result.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchData();
  }, []);

  const handleUpdateProfile = async (profile: User) => {
    try {
      const result = await userService.updateUser(profile);
      if (result.statusCode === 200) {
        Alert.alert("Profile updated successfully");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("An error occurred while updating the profile.");
    }
  };

  const [isImageValid, setIsImageValid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const pickFile = async () => {
    try {
      setErrorMessage('');
      setIsImageValid(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'audio/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFileUrl(asset.uri);
        console.log('uri:', asset.uri);

        if (asset && asset.uri) {
          // Get file info
          const fileInfo = await FileSystem.getInfoAsync(asset.uri);
          console.log('File info:', fileInfo);
          if (!fileInfo.exists || fileInfo.size === 0) {
            throw new Error('File does not exist or is empty');
          }
          if (fileInfo.size < 1000) {
            throw new Error(`File size too small (${fileInfo.size} bytes), likely corrupted`);
          }

          // Validate MIME type
          const extension = asset.name?.split('.').pop()?.toLowerCase() || '';
          const contentTypeMap = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            m4a: 'audio/mp4',
            mp3: 'audio/mpeg',
            wav: 'audio/wav',
          };
          const mimeType =
            (extension in contentTypeMap
              ? contentTypeMap[extension as keyof typeof contentTypeMap]
              : undefined) ||
            asset.mimeType ||
            'application/octet-stream';
          if (!mimeType.startsWith('image/') && !mimeType.startsWith('audio/')) {
            throw new Error(`Invalid MIME type: ${mimeType}`);
          }

          // Validate JPEG header (for JPEG files)
          if (mimeType === 'image/jpeg') {
            const fileContent = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.Base64,
              length: 2,
            });
            // Decode base64 to binary
            const binaryString = atob(fileContent);
            const bytes = new Uint8Array(binaryString.split('').map((c) => c.charCodeAt(0)));
            if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
              throw new Error('Invalid JPEG file: Missing SOI marker');
            }
            console.log('JPEG header validated successfully');
          }

          const key = await uploadFile(asset.uri, asset.name || 'image.jpg', mimeType, 'profile image file');
          const cloudfrontUrl = `https://d1fc7d6en42vzg.cloudfront.net/${key}`;
          console.log("key", key);
          await userService.updateUser({
            avatarURL: cloudfrontUrl
          })
          setFileUrl(cloudfrontUrl);
          setProfile((prev) => ({
            ...prev,
            avatarURL: cloudfrontUrl,
          }));

          // Read file content as Base64
          const fileContent = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const byteArray = Uint8Array.from(atob(fileContent), (c) => c.charCodeAt(0));
          const blob = new Blob([byteArray], { type: mimeType });
          console.log('Blob size:', blob.size, 'File size:', fileInfo.size);
          if (blob.size !== fileInfo.size) {
            throw new Error(`Blob size (${blob.size} bytes) does not match file size (${fileInfo.size} bytes)`);
          }

          // Create File object
          // const file = new File([blob], asset.name || 'image', { type: mimeType });

          // // Save File to local storage for inspection
          // const localPath = `${FileSystem.documentDirectory}${asset.name || 'image.jpg'}`;
          // await FileSystem.writeAsStringAsync(localPath, fileContent, {
          //   encoding: FileSystem.EncodingType.Base64,
          // });
          // console.log('File saved locally:', localPath);
          // Alert.alert('File saved', `Saved to: ${localPath}`);

          // Set image as valid for rendering
          setIsImageValid(true);

          // Proceed with upload

          Alert.alert('Image uploaded successfully');
          Alert.alert('Image uploaded successfully');
        }
      } else {
        Alert.alert('No file selected');
      }
    } catch (err) {
      console.error('File pick or validation error:', err);
      setIsImageValid(false);
      setErrorMessage('File is corrupted or invalid, please select another');
    }
  };
  // const pickImage = async () => {
  //   try {
  //     let result = await ImagePicker.launchImageLibraryAsync({
  //       mediaTypes: ImagePicker.MediaTypeOptions.All,
  //       allowsEditing: true,
  //       aspect: [4, 3],
  //       quality: 1,
  //     });

  //     if (!result.canceled) {
  //       let asset = result.assets[0];
  //       let uri = asset.uri;
  //       let fileName = uri.split('/').pop() || "avatar.jpg";
  //       let mimeType = asset.mimeType || "image/jpeg";

  //       // Upload to S3 using the updated util
  //       const key = await uploadFile(uri, fileName, mimeType, "avatar");
  //       setProfile((prev) => ({
  //         ...prev,
  //         avatarURL: `https://d1fc7d6en42vzg.cloudfront.net/${key}`,
  //       }));
  //       Alert.alert("Image uploaded successfully");
  //     } else {
  //       Alert.alert("Image selection cancelled");
  //       return;
  //     }
  //   } catch (error) {
  //     console.error("Error in pickImage:", error);
  //     Alert.alert("An error occurred while uploading the image.");
  //   }
  // };
  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    loginNav.navigate("Login");
  };

  return (
    <SafeAreaView>
      <MainHeader />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex flex-col justify-center items-center">
          {<Avatar
            source={
              profile.avatarURL
                ? { uri: profile.avatarURL }
                : require("../../../assets/avatar.jpg")
            }
            size="xlarge"
            rounded
            containerStyle={{ marginTop: 20 }}
            onPress={() => console.log("Works!")}
          />}
          {/* {selectedFileUrl && (
            <Image
              source={{ uri: selectedFileUrl }}
              style={{ width: 200, height: 200 }}
              onLoad={() => {
                console.log('Image rendered successfully');
                setIsImageValid(true);
              }}
              onError={() => {
                console.error('Failed to render image, likely corrupted');
                setIsImageValid(false);
                setErrorMessage('File is corrupted or invalid, please select another');
              }}
            />
          )} */}
          <TouchableOpacity onPress={() => {
            pickFile();
          }}>
            <Text>Change Image</Text>
          </TouchableOpacity>
          <View className="w-[90%] justify-center items-center ">
            <Text className="text-black ml-5 self-start text-base font-semibold leading-none">
              BirthDate
            </Text>
            <TouchableOpacity onPress={() => setShow(true)} className="flex flex-row w-2/3 justify-center items-center ">
              <View className="bg-white w-2/3  rounded-[15px] shadow p-3">
                <Text className="text-black ml-[2px] text-base font-semibold leading-none">
                  {new Date(profile.birthDate).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>
              {/* {show && (
                <DateTimePicker
                  value={new Date(profile.birthDate)}
                  mode="date" // Use "time" for time picker or "datetime" for both
                  display="default" // "default", "spinner", or "calendar" (iOS-specific options)
                  onChange={onChange} // Callback when the date is changed
                />
              )} */}
            </TouchableOpacity>
          </View>
          <InputField
            label="First Name"
            value={profile.firstName}
            onChangeText={(value) => handleInputChange("firstname", value)}
          />
          <InputField
            label="Last Name"
            value={profile.lastName}
            onChangeText={(value) => handleInputChange("lastname", value)}
          />
          <InputField
            label="Email"
            value={profile.email}
            onChangeText={(value) => handleInputChange("email", value)}
          />
          <InputField
            label="Phone Number"
            value={profile.phone}
            onChangeText={(value) => handleInputChange("phone", value)}
          />
          <View
            style={{ marginTop: 1 }}
            className="flex flex-row justify-center items-center gap-7" // Add w-[90%] to constrain width
          >
            <TouchableOpacity
              className="flex-row justify-between items-center bg-secondary rounded-lg shadow p-3"
              onPress={() => {
                console.log(profile);
                handleUpdateProfile({ ...profile, birthDate: new Date(profile.birthDate) });
              }}
            >
              <Icon
                name="checkbox-marked-outline"
                type="material-community"
                color="white"
                size={25}
              />
              <Text className="text-white text-xs font-semibold">Update</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row justify-between items-center bg-secondary rounded-lg shadow p-3"
              onPress={() => handleLogout()}
            >
              <Icon
                name="logout"
                type="material-community"
                color="white"
                size={25}
              />
              <Text className="text-white text-xs font-semibold">Log out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};
export default Profile;