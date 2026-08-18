import axios from "axios";

const base = import.meta.env.VITE_API;
export const getCourses = (params = {}) => axios.get(`${base}/courses`, { params });
export const getCourse = (slug) => axios.get(`${base}/courses/${slug}`);
export const getMyCourses = () => axios.get(`${base}/user/courses`);
export const enrollFreeCourse = (id) => axios.post(`${base}/courses/${id}/enroll`);
export const createCoursePaymentIntent = (id) => axios.post(`${base}/courses/${id}/payment-intent`);
export const confirmCoursePayment = (id, paymentIntentId) => axios.post(`${base}/courses/${id}/confirm-payment`, { paymentIntentId });
export const completeCourseLesson = (id, lessonId) => axios.put(`${base}/courses/${id}/progress`, { lessonId });
export const getAdminCourses = () => axios.get(`${base}/admin/courses`);
export const createCourse = (payload) => axios.post(`${base}/admin/courses`, payload);
export const updateCourse = (id, payload) => axios.put(`${base}/admin/courses/${id}`, payload);
export const deleteCourse = (id) => axios.delete(`${base}/admin/courses/${id}`);
