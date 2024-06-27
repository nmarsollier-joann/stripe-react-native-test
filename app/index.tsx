import { confirmPlatformPayPayment, PaymentSheetError, PlatformPay, PlatformPayButton, StripeProvider, usePlatformPay, useStripe } from '@stripe/stripe-react-native';
import { Stack } from 'expo-router';
import * as React from 'react';
import { Alert, Linking, Text, TouchableOpacity } from 'react-native';


export default function Page() {
  // Setup a return url, after login we need to return to the app with a deeplink
  const { handleURLCallback } = useStripe();

  const handleDeepLink = React.useCallback(
    async (url: string | null) => {
      if (url) {
        const stripeHandled = await handleURLCallback(url);
        if (stripeHandled) {
          // This was a Stripe URL - you can return or add extra handling here as you see fit
        } else {
          // This was NOT a Stripe URL – handle as you normally would
        }
      }
    },
    [handleURLCallback]
  );

  React.useEffect(() => {
    const getUrlAsync = async () => {
      const initialUrl = await Linking.getInitialURL();
      handleDeepLink(initialUrl);
    };

    getUrlAsync();

    const deepLinkListener = Linking.addEventListener(
      'url',
      (event: { url: string }) => {
        handleDeepLink(event.url);
      }
    );

    return () => deepLinkListener.remove();
  }, [handleDeepLink]);

  return <>
    <Stack.Screen options={{ headerShown: false }} />
    <StripeProvider
      publishableKey="pk_test_51PVa7VHKcApJiuV2przxuC5i66z0ULgabU3LSyNC4lvmzrC08FAohxK9h3KvoafI8OhKBbppiComea8Re7QvfYvQ00N8lb4PbD"
      urlScheme="https"
      merchantIdentifier="merchant.com.myapp"
    >
      <CheckoutScreen />
    </StripeProvider>
  </>
}

function CheckoutScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const clientSecret = "pi_3PWJnsHKcApJiuV20KJTTXYG_secret_13q1rNSZb9wmenD3VBYOSxfsR"

  const { isPlatformPaySupported } = usePlatformPay();

  React.useEffect(() => {
    (async function () {
      if (!(await isPlatformPaySupported({ googlePay: { testEnv: true } }))) {
        Alert.alert('Google Pay is not supported.');
      }
    })();
  }, []);

  const initializePaymentSheet = async () => {
    const { error } = await initPaymentSheet({
      merchantDisplayName: "Example, Inc.",
      paymentIntentClientSecret: clientSecret,
    });
    if (error) {
      console.log(JSON.stringify(error))
      // handle error
    }
  };

  const confirmHandler = async (paymentMethod: any, shouldSavePaymentMethod: any, intentCreationCallback: any) => {
    // Make a request to your own server to retrieve the client secret of the payment intent.

    if (clientSecret) {
      intentCreationCallback({ clientSecret })
    } else {
      intentCreationCallback({ error: "Error" })
    }
  }

  const didTapCheckoutButton = async () => {
    await initializePaymentSheet()
    const { error } = await presentPaymentSheet();

    if (error) {
      console.log(JSON.stringify(error))

      if (error.code === PaymentSheetError.Canceled) {
        // Customer canceled - you should probably do nothing.
      } else {
        // PaymentSheet encountered an unrecoverable error. You can display the error to the user, log it, etc.
      }
    } else {
      // Payment completed - show a confirmation screen.
    }
  }

  const pay = async () => {
    const { error } = await confirmPlatformPayPayment(
      clientSecret,
      {
        googlePay: {
          testEnv: true,
          merchantName: 'My merchant name',
          merchantCountryCode: 'US',
          currencyCode: 'USD',
          billingAddressConfig: {
            format: PlatformPay.BillingAddressFormat.Full,
            isPhoneNumberRequired: true,
            isRequired: true,
          },
        },
        applePay: {
          cartItems: [
            {
              label: 'Example item name',
              amount: '14.00',
              paymentType: PlatformPay.PaymentType.Immediate,
            },
            {
              label: 'Total',
              amount: '12.75',
              paymentType: PlatformPay.PaymentType.Immediate,
            },
          ],
          merchantCountryCode: 'US',
          currencyCode: 'USD',
          requiredShippingAddressFields: [
            PlatformPay.ContactField.PostalAddress,
          ],
          requiredBillingContactFields: [PlatformPay.ContactField.PhoneNumber],
        },
      }
    );

    if (error) {
      Alert.alert(error.code, error.message);
      // Update UI to prompt user to retry payment (and possibly another payment method)
      return;
    }
    Alert.alert('Success', 'The payment was confirmed successfully.');
  };

  return (
    <TouchableOpacity
      onPress={() => {
        didTapCheckoutButton();
      }}>
      <Text>Pay</Text>

      <PlatformPayButton
        type={PlatformPay.ButtonType.Pay}
        onPress={pay}
        style={{
          width: '100%',
          height: 50,
        }}
      />
    </TouchableOpacity>
  )
}
