import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { Button } from "react-native-elements";
import CourseItem from "../../components/CourseItem";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { LearningScreenNavigationProp } from "../../type"
import courseService from "../../services/course.service";

import { MyCourse } from "../../models";
import MainHeader from "../../components/MainHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList } from "react-native-gesture-handler";
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import courseCategoryService from "../../services/courseCategory.service";
import DropDownPicker from 'react-native-dropdown-picker';

export default function LearningScreen() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState<any[]>([]);
  const nav = useNavigation<LearningScreenNavigationProp>();
  const [buttonSelected, setButtonSelected] = React.useState("All");
  const [studentCourses, setStudentCourses] = useState<MyCourse[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<MyCourse[]>([]);
  const [isTeacher, setIsTeacher] = useState<boolean>()
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  interface CourseCategory {
    id: string;
    name: string;
  }
  const [courseCategories, setCourseCategories] = useState<CourseCategory[]>(
    []
  );
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    state: "DRAFT",
    thumbnail_image: "",
    categoryId: "",
    price: "",
  });
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

      setIsTeacher(groups?.includes("TEACHER"));
      console.log(decoded);
      console.log(groups?.includes("TEACHER"));
      try {
        const result = await courseCategoryService.getCourseCategories();
        console.log("result", result);

        if (result.statusCode === 200) {
          setCourseCategories(result.data);
          setItems(result.data.map((cat: any) => ({ label: cat.name, value: cat.id })))
        } else {
          console.error(
            "Error fetching course categories, status code: ",
            result.statusCode
          );
        }
      } catch (error) {
        console.error("Error fetching course categories:", error);
      }


      try {

        const result = await courseService.getTeacherCourses();
        console.log("result", result);

        if (result.statusCode === 200) {
          setTeacherCourses(result.data);
        } else {
          console.error(
            "Error fetching course , status code: ",
            result.statusCode
          );
        }
      } catch (error) {
        console.error("Error fetching course categories:", error);
      }
    };

    decodeTokenAndFetch();
  }, []);

  useFocusEffect(
    useCallback(() => {

      if (isTeacher) return
      const fetchStudentCourses = async () => {
        try {
          const res = await courseService.getStudentCourses();
          console.log("res", res);

          if (res.statusCode === 200) {
            console.log("ok");

            setStudentCourses(res.data);
          } else {
            console.error(
              "Error fetching student courses, status code: ",
              res.statusCode
            );
          }
        } catch (error) {
          console.error("Error fetching student courses: ", error);
        }
      };

      fetchStudentCourses();
    }, [])) // Empty dependenc
  console.log(studentCourses.map((course) => course.id));

  return (
    <SafeAreaView className="w-full h-full flex-1 ">
      <MainHeader />
      <ScrollView className="w-full px-[24px] py-6">
        <Text className="font-semibold text-base text-[#5D5FEF] mb-4">
          My Courses
        </Text>
        <View className="w-full flex flex-row items-center justify-between">
          <Button
            title="All"
            type={buttonSelected === "All" ? "solid" : "outline"}
            className="rounded-[30px] px-3 py-[14px]"
            buttonStyle={{
              backgroundColor:
                buttonSelected === "All" ? "#EF5DA8" : "transparent",
            }}
            titleStyle={{
              color: buttonSelected === "All" ? "#ffffff" : "#000000",
            }}
            onPress={() => setButtonSelected("All")}
          ></Button>

          {/* {
            !isTeacher && (
              <>
                <Button
                  title="In progress"
                  type={buttonSelected === "In progress" ? "solid" : "outline"}
                  className="rounded-[30px] px-3 py-[14px]"
                  buttonStyle={{
                    backgroundColor:
                      buttonSelected === "In progress" ? "#EF5DA8" : "transparent",
                  }}
                  titleStyle={{
                    color: buttonSelected === "In progress" ? "#ffffff" : "#000000",
                  }}
                  onPress={() => setButtonSelected("In progress")}
                ></Button>
                <Button
                  title="Finished"
                  type={buttonSelected === "Finished" ? "solid" : "outline"}
                  className="rounded-[30px] px-3 py-[14px]"
                  buttonStyle={{
                    backgroundColor:
                      buttonSelected === "Finished" ? "#EF5DA8" : "transparent",
                  }}
                  titleStyle={{
                    color: buttonSelected === "Finished" ? "#ffffff" : "#000000",
                  }}
                  onPress={() => setButtonSelected("Finished")}
                ></Button>
                <Button
                  title="Favorited"
                  type={buttonSelected === "Favorited" ? "solid" : "outline"}
                  className="rounded-[30px] px-3 py-[14px]"
                  buttonStyle={{
                    backgroundColor:
                      buttonSelected === "Favorited" ? "#EF5DA8" : "transparent",
                  }}
                  titleStyle={{
                    color: buttonSelected === "Favorited" ? "#ffffff" : "#000000",
                  }}
                  onPress={() => setButtonSelected("Favorited")}
                >
                  Favorited
                </Button>

              </>
            )
          } */}

          {
            isTeacher && (
              <>
                <Button
                  title="+ Create Course"
                  type="solid"
                  buttonStyle={{
                    backgroundColor: "#5D5FEF",
                    borderRadius: 30,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    marginLeft: 8,
                  }}
                  titleStyle={{
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                  onPress={() => setShowCreateCourse(true)}
                />
              </>
            )
          }

        </View>

        {/* Create Course Popup */}
        {showCreateCourse && (
          <View
            style={{
              position: "absolute",
              top: 100,
              left: 20,
              right: 20,
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 10,
              elevation: 10,
              zIndex: 1000, // Ensure popup is above other elements
            }}
          >
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>
              Create New Course
            </Text>
            <View style={{ zIndex: 2000 }}>
              <TextInput
                placeholder="Title"
                value={newCourse.title}
                onChangeText={(text) => setNewCourse({ ...newCourse, title: text })}
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 10,
                }}
              />
              <TextInput
                placeholder="Description"
                value={newCourse.description}
                onChangeText={(text) => setNewCourse({ ...newCourse, description: text })}
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 10,
                }}
              />
              <TextInput
                placeholder="Thumbnail Image URL"
                value={newCourse.thumbnail_image}
                onChangeText={(text) => setNewCourse({ ...newCourse, thumbnail_image: text })}
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 10,
                }}
              />
              <DropDownPicker
                open={open}
                value={value}
                items={items}
                setOpen={setOpen}
                setValue={setValue}
                setItems={setItems}
                placeholder="Select category..."
                onChangeValue={(val) => setNewCourse({ ...newCourse, categoryId: val ? String(val) : "" })}
                zIndex={3000}
                zIndexInverse={2000}
                dropDownContainerStyle={{
                  borderColor: "#ccc",
                  zIndex: 3000,
                }}
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 10,
                }}
              />
              <TextInput
                placeholder="Price"
                value={newCourse.price}
                onChangeText={(text) => setNewCourse({ ...newCourse, price: text })}
                keyboardType="numeric"
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 10,
                }}
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowCreateCourse(false)}
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
                  try {
                    const res = await courseService.createCourses(newCourse);
                    if (res.statusCode === 200 || res.statusCode === 201) {
                      const createdCourse: MyCourse = {
                        id: res.data?.generatedMaps[0].id,
                        title: newCourse.title,
                        thumbnail_image: newCourse.thumbnail_image,
                        ratingCount: 5,
                        teacherName: "Bao Nguyen"
                      }

                      setTeacherCourses((prev) => ([
                        ...prev,
                        createdCourse
                      ]))
                      setShowCreateCourse(false);
                      setNewCourse({
                        title: "",
                        description: "",
                        state: "DRAFT",
                        thumbnail_image: "",
                        categoryId: "",
                        price: "",
                      });
                    } else {
                      console.error("Error creating course, status code: ", res.statusCode);
                      Alert.alert("Error", "Failed to create course. Please try again.");
                    }
                  } catch (error) {
                    console.error("Error creating course:", error);
                    Alert.alert("Error", "Failed to create course. Please try again.");
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
        <View className="w-full flex flex-col   items-center mt-5">
          {!isTeacher ?
            studentCourses.map((course) => (
              <View className="pb-6 " key={course.id}>
                <CourseItem
                  srcImg={course.thumbnail_image}
                  title={course.title}
                  teacherName={course.teacherName}
                  rated={course.ratingCount}
                  onPressItem={() => {
                    nav.navigate("CourseHome", { course: course });
                  }}
                  progress={50}
                />
              </View>
            ))
            :
            teacherCourses.map((course) => (
              <View className="pb-6 " key={course.id}>
                <CourseItem
                  srcImg={course.thumbnail_image}
                  title={course.title}
                  teacherName={course.teacherName}
                  rated={course.ratingCount}
                  onPressItem={() => {
                    nav.navigate("CourseHome", { course: course });
                  }}
                  progress={0.5}
                />
              </View>
            ))
          }
          {/* <FlatList
          data={studentCourses}
          renderItem={({ item,index }) => (
            <CourseItem
              srcImg={item.thumbnail_image}
              title={item.title}
              teacherName={item.teacherName}
              rated={item.ratingCount}
              onPressItem={() => {
                nav.navigate("CourseHome", { course: item });
              }}
              progress={50}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
        /> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
