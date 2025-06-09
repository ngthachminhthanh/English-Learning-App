import {
  View,
  Text,
  ImageBackground,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { Button, CheckBox } from "@rneui/themed";
import { Formik } from "formik";
import * as Yup from "yup";
import { useNavigation } from "@react-navigation/native";
import {
  LoginScreenNavigationProp,
  OTPVerificationScreenNavigationProp,
} from "../../type";
import authService from "../../services/auth.service";
import * as SecureStore from "expo-secure-store";

const validationSchema = Yup.object().shape({
  username: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
});

const Login = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const otpVerifyNav = useNavigation<OTPVerificationScreenNavigationProp>();
  const [rememberMe, setRememberMe] = useState(false);
  
  const handleSignIn = async (values: any) => {
    console.log("Attempting sign in with:", values);
    try {
      const res = await authService.signIn(values);
      console.log("Sign in response:", res);
      
      if (res.statusCode === 201) {
        console.log("res.data",res.data);
        console.log("res", res);
        
        // res.data: { accessToken: string, refreshToken: string }
        await SecureStore.setItemAsync("accessToken", res.data.accessToken);
        const accessWhenLogin = await SecureStore.getItemAsync("accessToken")
        console.log("access token:", accessWhenLogin);
        // await SecureStore.setItemAsync("refreshToken", res.data.refreshToken);

        navigation.navigate("BottomTabsNavigator");
      } else if (
        res.message === "Failed to sign in: Incorrect username or password." // temporary condition because statusCode is not different for cases
      ) {
        console.error("Sign in failed - incorrect credentials:", res.message);
        Alert.alert("Failed to sign in", "Incorrect username or password.");
      } else {
        console.log("Need OTP verification:", res.message);
        otpVerifyNav.navigate("OTPVerification", {
          username: values.username,
          isConfirmSignUp: true,
        });
      }
    } catch (err) {

      console.error("Sign in error:", err);
      
      // Enhanced error handling
      let errorMessage = "An error occurred.";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        // If it's a network error or API error
        if ('message' in err) {
          errorMessage = err.message;
        } else if ('response' in err && err.response) {
          // Axios error structure
          const response = err.response as any;
          if (response.data && response.data.message) {
            errorMessage = response.data.message;
          } else if (response.statusText) {
            errorMessage = `${response.status}: ${response.statusText}`;
          }
        } else {
          errorMessage = JSON.stringify(err);
        }
      }
      
      console.error("Detailed error:", errorMessage);
      Alert.alert("Failed to sign in", errorMessage);

    }
  };
  
  return (
    <ImageBackground
      source={require("../../../assets/signupbg.png")}
      style={{ width: "100%", height: "100%" }}
    >
      <View className="flex gap-5 mt-[80px] items-center">
        <Image
          source={require("../../../assets/avatar.png")}
          className="w-[100px] h-[110px]"
        />
        <Text className="text-[38px] font-semibold text-[#5D5FEF]">
          Welcome Back
        </Text>
        <View className="flex flex-row">
          {/* <TouchableOpacity>
            <Image
              source={require("../../../assets/google.png")}
              className="w-[40px] h-[40px] mr-12"
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image
              source={require("../../../assets/facebook.png")}
              className="w-[40px] h-[40px]"
            />
          </TouchableOpacity> */}
        </View>

        <Formik
          initialValues={{
            username: "",
            password: "",
          }}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            console.log("Form submitted with values:", values);
            handleSignIn(values);
          }}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <View className="flex gap-y-3 mt-3 mx-auto">
              <TextInput
                placeholder="Username"
                className="border-2 border-[#EF5DA8] w-[280] h-10 rounded-[10px] items-center px-4"
                onChangeText={handleChange("username")}
                onBlur={handleBlur("username")}
                value={values.username}
              />
              {errors.username && touched.username && (
                <Text style={{ color: "red" }}>{errors.username}</Text>
              )}
              <TextInput
                placeholder="Password"
                className="border-2 border-[#EF5DA8] w-[280] h-10 rounded-[10px] items-center px-4"
                onChangeText={handleChange("password")}
                onBlur={handleBlur("password")}
                value={values.password}
                secureTextEntry
              />
              {errors.password && touched.password && (
                <Text style={{ color: "red" }}>{errors.password}</Text>
              )}

              <View className="flex flex-row justify-end items-center w-[280px]">
                {/* <CheckBox
                  title="Remember me"
                  checked={rememberMe}
                  onPress={() => setRememberMe(!rememberMe)}
                  containerStyle={{
                    backgroundColor: "transparent",
                    borderWidth: 0,
                  }}
                  textStyle={{
                    color: "#000",
                  }}
                  checkedColor="#EF5DA8"
                /> */}
                <TouchableOpacity
                  onPress={() => navigation.navigate("ForgotPassword")}
                >
                  <Text
                    style={{
                      color: "#EF5DA8",
                      textDecorationLine: "underline",
                    }}
                  >
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>

              <Button
                title={"Login"}
                containerStyle={{
                  display: "flex",
                  alignItems: "center",
                }}
                buttonStyle={{
                  backgroundColor: "#EF5DA8",
                  borderRadius: 12,
                  width: 150,
                }}
                onPress={() => {
                  console.log("Login button pressed");
                  handleSignIn(values);
                }}
              />
            </View>
          )}
        </Formik>
        <Text>
          Don't have an account?{" "}
          <Text
            style={{ color: "#EF5DA8", textDecorationLine: "underline" }}
            onPress={() => navigation.navigate("SignUp")}
          >
            Sign Up
          </Text>{" "}
        </Text>
      </View>
    </ImageBackground>
  );
};

export default Login;