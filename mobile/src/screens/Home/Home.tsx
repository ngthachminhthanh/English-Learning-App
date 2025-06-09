import { View, Text, ScrollView, TextInput, TouchableOpacity, SafeAreaView } from "react-native";
import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";

import DirectToSectionCard from "../../components/Home/DirectToSectionCard";
import CategoryCard from "../../components/Home/CategoryCard";
import CourseCard from "../../components/Home/CourseCard";
import MainHeader from "../../components/MainHeader";

import courseCategoryService from "../../services/courseCategory.service";
import courseService from "../../services/course.service";

import { Course } from "../../models";

const Home = () => {
  const [isTeacher, setIsTeacher] = useState<boolean>();
  const [userName, setUserName] = useState("");
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [courseCategories, setCourseCategories] = useState<{ id: string; name: string }[]>([]);
  const [recommendationCourses, setRecommendationCourses] = useState<Course[]>([]);

  useEffect(() => {
    interface DecodedToken {
      [key: string]: any;
      "cognito:groups"?: string[];
      username: string;
    }

    const decodeTokenAndFetch = async () => {
      const token = await SecureStore.getItemAsync("accessToken");
      const decoded = jwtDecode<DecodedToken>(token || "");
      setUserName(decoded.username || "");
      setIsTeacher(decoded["cognito:groups"]?.includes("TEACHER") || false);

      try {
        const result = await courseCategoryService.getCourseCategories();
        if (result.statusCode === 200) setCourseCategories(result.data);
      } catch (err) {
        console.error("Error fetching categories", err);
      }

      try {
        const res = await courseService.getAllCourses(); // Replace with getRecommendationCourses later
        if (res.statusCode === 200) setRecommendationCourses(res.data.data);
      } catch (err) {
        console.error("Error fetching courses", err);
      }
    };

    decodeTokenAndFetch();
  }, []);

  return (
    <SafeAreaView>
      <MainHeader showSearchButton={true} />
      <ScrollView style={{ padding: 10 }} className="flex flex-col gap-4 pb-20">
        {/* Greeting Section */}
        <View className="welcome-container w-3/4 flex flex-row items-center gap-1">
          <View className="flex flex-col">
            <Text className="text-xl font-bold text-black">
              Welcome back, <Text className="text-xl font-bold text-blue1">{userName}!</Text>
            </Text>
            <Text className="text-lg text-black">{isTeacher ? "Let's start teaching" : "Let's start learning"}</Text>
          </View>
        </View>

        {/* Direct Section Cards */}
        <ScrollView
          horizontal
          contentContainerStyle={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 10,
            gap: 10,
          }}
        >
          {recommendationCourses.length > 0 &&
            recommendationCourses.slice(0, 2).map((course) => (
              <DirectToSectionCard
                key={course.id}
                courseId={course.id}
                courseName={course.name}
              />
            ))}
        </ScrollView>

        {/* Course Categories */}
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
              <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>Create Category</Text>
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
                  style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#eee", borderRadius: 8 }}
                >
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    if (newCategoryName.trim()) {
                      await courseCategoryService.createCourseCategories({ name: newCategoryName });
                      setCourseCategories([...courseCategories, { id: Date.now().toString(), name: newCategoryName }]);
                      setNewCategoryName("");
                      setShowCreateCategory(false);
                    }
                  }}
                  style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#5D5FEF", borderRadius: 8 }}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Recommended Courses */}
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
