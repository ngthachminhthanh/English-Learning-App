import React from 'react';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Alert } from 'react-native';
import { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';

// Define navigation stack types
type RootStackParamList = {
  PurchaseCourse: undefined;
  PaymentWebView: { redirectUrl: string; courseBuyingId: string };
  Validation: { courseBuyingId: string };
};

// Define navigation and route prop types
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'PaymentWebView'>;

const PaymentWebView: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { redirectUrl, courseBuyingId } = route.params;

  const handleNavigationStateChange = (navState: { url: string }) => {
    const { url } = navState;
    // Detect redirect to vnp_ReturnUrl (ngrok URL)
    if (url.includes('/api/course-buying/payment-return')) {
      // Extract query parameters
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const transactionStatus = urlParams.get('vnp_TransactionStatus');
      const txnRef = urlParams.get('vnp_TxnRef');
      const extractedCourseBuyingId = txnRef ? txnRef.replace('COURSE', '') : courseBuyingId;

      if (transactionStatus === '00') {
        Alert.alert('Success', 'Payment successful');
        navigation.navigate('Validation', { courseBuyingId: extractedCourseBuyingId });
      } else {
        Alert.alert('Failed', `Payment failed with status: ${transactionStatus}`);
        navigation.goBack();
      }
    }
  };

  return (
    <WebView
      source={{ uri: redirectUrl }}
      onNavigationStateChange={handleNavigationStateChange}
      startInLoadingState
      javaScriptEnabled
      domStorageEnabled
      style={{ flex: 1 }}
    />
  );
};

export default PaymentWebView;