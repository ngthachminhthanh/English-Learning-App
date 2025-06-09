import { View, Text, ScrollView, Image, Button, TouchableOpacity, TextInput } from "react-native";
import React, { useState, useEffect } from "react";
import DirectToSectionCard from "../../components/Home/DirectToSectionCard";
import CategoryCard from "../../components/Home/CategoryCard";
import CourseCard from "../../components/Home/CourseCard";
import colors from "../../../colors";
import courseCategoryService from "../../services/courseCategory.service";
import courseService from "../../services/course.service";
import { Course } from "../../models";
import MainHeader from "../../components/MainHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";


// Example usage:

const Home = () => {

  const [isTeacher, setIsTeacher] = useState<boolean>()
  const [userName, setUserName] = useState("")
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const insets = useSafeAreaInsets();

  interface CourseCategory {
    id: string;
    name: string;
  }

  const [courseCategories, setCourseCategories] = useState<CourseCategory[]>(
    []
  );
  const [recommendationCourses, setRecommendationCourses] = useState<Course[]>(
    []
  );

  useEffect(() => {
    interface DecodedToken {
      [key: string]: any;
      "cognito:groups"?: string[];
      "username": string
    }

    const decodeTokenAndFetch = async () => {
      // 1. Decode token and set isTeacher
      const token = await SecureStore.getItemAsync("accessToken");
      const decoded = jwtDecode<DecodedToken>(token || "");
      const groups = decoded["cognito:groups"];
      const username = decoded["username"]
      setUserName(username)
      setIsTeacher(groups?.includes("TEACHER"));
      console.log(decoded);
      console.log(groups?.includes("TEACHER"));

      // 2. Fetch course categories
      try {
        const result = await courseCategoryService.getCourseCategories();
        console.log("result", result);

        if (result.statusCode === 200) {
          setCourseCategories(result.data);
        } else {
          console.error(
            "Error fetching course categories, status code: ",
            result.statusCode
          );
        }
      } catch (error) {
        console.error("Error fetching course categories:", error);
      }

      // 3. Fetch recommendation courses
      try {
        const res = await courseService.getAllCourses(); 
        if (res.statusCode === 200) {
          setRecommendationCourses(res.data.data);
        } else {
          console.error(
            "Error fetching recommendation courses, status code: ",
            res.statusCode
          );
        }
      } catch (error) {
        console.error("Error fetching recommendation courses: ", error);
      }
    };

    decodeTokenAndFetch();
  }, []);



  return (
    <SafeAreaView>
      <MainHeader showSearchButton={true} />
      <ScrollView
        contentContainerStyle={{
          padding: 10,
        }}
        className="flex flex-col gap-4 pb-20"
      >
        <View className="welcome-container w-3/4 flex flex-row items-center gap-1">
          <View className="flex flex-col">
            <Text className="text-xl font-bold text-black">
              Welcome back,{" "}
              <Text className="text-xl font-bold text-blue1">{userName}!</Text>
            </Text>
            <Text className="text-lg text-black">{isTeacher ? "Let's start teaching" : "Let's start learning"}</Text>
          </View>
        </View>
        <ScrollView
          horizontal
          contentContainerStyle={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 10,
            gap: 10,
          }}
        >

        </ScrollView>
        <View className="categories flex flex-col gap-2">
          <View className="heading flex flex-row justify-between items-center">
            <Text className="text-lg font-bold text-blue1">Categories</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text className="text-sm text-blue1">View all</Text>
              {isTeacher && (
                <TouchableOpacity
                  style={{
                    backgroundColor: "#5D5FEF",
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    marginLeft: 8,
                  }}
                  onPress={() => setShowCreateCategory(true)}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>+ Create</Text>
                </TouchableOpacity>
              )}

            </View>
          </View>
          <ScrollView
            horizontal
            contentContainerStyle={{
              gap: 10,
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
            }}
          >
            {courseCategories.map((category) => (
              <CategoryCard name={category.name} key={category.id} />
            ))}
          </ScrollView>

          {/* Create Category Popup */}
          {showCreateCategory && (
            <View
              style={{
                position: "absolute",
                top: 100,
                left: 0,
                right: 0,
                backgroundColor: "#fff",
                padding: 20,
                margin: 20,
                borderRadius: 10,
                elevation: 10,
                zIndex: 100,
              }}
            >
              <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>
                Create Category
              </Text>
              <TextInput
                placeholder="Category name"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 16,
                }}
              />
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setShowCreateCategory(false)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    backgroundColor: "#eee",
                    borderRadius: 8,
                  }}
                >
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    // Call your API or update state here
                    if (newCategoryName.trim()) {
                      await courseCategoryService.createCourseCategories({
                        "name": newCategoryName
                      })
                      // Optionally call your backend to create the category
                      setCourseCategories([
                        ...courseCategories,
                        { id: Date.now().toString(), name: newCategoryName },
                      ]);
                      setNewCategoryName("");
                      setShowCreateCategory(false);
                    }
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    backgroundColor: "#5D5FEF",
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        {!isTeacher && (
          <>

          </>
        )}
        <View className="recommend flex flex-col gap-2">
          <View className="heading flex flex-row items-center">
            <Text className="text-lg font-bold text-blue1">Recommend for you</Text>
          </View>
          <View
            className="courses-container"
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 20,
              marginBottom: 20,
            }}
          >
            {Array.isArray(recommendationCourses) && recommendationCourses.length > 0 ? (
              recommendationCourses.map((course) => (
                <CourseCard course={course} key={course.id} />
              ))
            ) : (
              <Text>No courses available</Text>
            )}
          </View>
        </View>


      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;