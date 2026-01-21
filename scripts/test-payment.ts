import 'reflect-metadata';
import { AppDataSource, initializeDatabase } from '../src/config/database';
import { OPayService } from '../src/services/opay.service';
import { config } from '../src/config/env';

const testOPayConnection = async () => {
  try {
    await initializeDatabase();
    console.log('✅ Database connected\n');

    // Check if OPay credentials are set
    if (!config.opay.merchantId || !config.opay.publicKey || !config.opay.secretKey) {
      console.error('❌ Error: OPay credentials not found in environment variables');
      console.log('\nPlease ensure these are set in your .env file:');
      console.log('  OPAY_MERCHANT_ID=your-merchant-id');
      console.log('  OPAY_PUBLIC_KEY=your-public-key (for payment creation)');
      console.log('  OPAY_SECRET_KEY=your-secret-key (for other APIs)');
      process.exit(1);
    }

    console.log('OPay Configuration:');
    console.log(`  Merchant ID: ${config.opay.merchantId.substring(0, 10)}...`);
    console.log(`  Public Key: ${config.opay.publicKey.substring(0, 10)}... (for payment creation)`);
    console.log(`  Secret Key: ${config.opay.secretKey.substring(0, 10)}... (for signature APIs)`);
    console.log(`  Environment: ${config.nodeEnv}`);
    console.log(`  Base URL: ${config.nodeEnv === 'production' ? 'https://liveapi.opaycheckout.com' : 'https://testapi.opaycheckout.com'}`);
    console.log(`  Callback URL: ${config.opay.callbackUrl}`);
    console.log(`  Return URL: ${config.opay.returnUrl}\n`);

    const opayService = new OPayService();

    // Test 1: OPay Cashier (Express Checkout) - Recommended
    console.log('🧪 Test 1: Testing OPay Cashier (Express Checkout)...\n');
    
    const testCashierReference = `CASHIER-${Date.now()}`;
    const testCashierPayment = {
      reference: testCashierReference,
      amount: {
        currency: 'NGN',
        total: 100, // 100 Naira = 10000 cents
      },
      product: {
        name: 'Test Book Order',
        description: 'Test Cashier payment for BOOKMATE',
      },
      country: 'NG',
      callbackUrl: config.opay.callbackUrl,
      returnUrl: config.opay.returnUrl,
      expireAt: 30,
      customerName: 'Test User',
      userInfo: {
        userId: 'test-user-001',
        userName: 'Test User',
        userEmail: 'test@bookmate.com',
        userMobile: '+2348000000000',
      },
    };

    console.log('Cashier Request:', JSON.stringify(testCashierPayment, null, 2));
    console.log('\nCalling OPay Cashier API...\n');

    const cashierResponse = await opayService.createCashierPayment(testCashierPayment);

    console.log('Cashier Response:', JSON.stringify(cashierResponse, null, 2));
    console.log('\n');

    if (cashierResponse.code === '00000') {
      console.log('✅ SUCCESS: Cashier payment created successfully!');
      if (cashierResponse.data) {
        console.log(`  Reference: ${cashierResponse.data.reference}`);
        console.log(`  Order No: ${cashierResponse.data.orderNo}`);
        console.log(`  Status: ${cashierResponse.data.status}`);
        if (cashierResponse.data.cashierUrl) {
          console.log(`  Cashier URL: ${cashierResponse.data.cashierUrl}`);
          console.log('\n  👉 Redirect user to this URL to complete payment');
        }
      }
    } else {
      console.log(`❌ FAILED: ${cashierResponse.message}`);
      console.log(`  Error Code: ${cashierResponse.code}`);
    }

    // Test 2: ReferenceCode payment (Server-to-Server)
    console.log('\n\n🧪 Test 2: Testing ReferenceCode Payment (Server-to-Server)...\n');
    
    const testReference = `TEST-${Date.now()}`;
    const testPayment = {
      reference: testReference,
      amount: {
        currency: 'NGN',
        total: 100, // 100 Naira = 10000 cents
      },
      product: {
        name: 'Test Book Order',
        description: 'Test payment for BOOKMATE',
      },
      payMethod: 'ReferenceCode' as const,
      country: 'NG',
      callbackUrl: config.opay.callbackUrl,
      returnUrl: config.opay.returnUrl,
      expireAt: 30,
      merchantName: 'BOOKMATE',
      notify: {
        notifyUserName: 'Test User',
        notifyLanguage: 'English',
        notifyMethod: 'BOTH',
        notifyUserEmail: 'test@bookmate.com',
        notifyUserMobile: '+2348000000000',
      },
    };

    console.log('Request:', JSON.stringify(testPayment, null, 2));
    console.log('\nCalling OPay API...\n');

    const response = await opayService.createPayment(testPayment);

    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('\n');

    if (response.code === '00000') {
      console.log('✅ SUCCESS: Payment created successfully!');
      if (response.data) {
        console.log(`  Reference: ${response.data.reference}`);
        console.log(`  Order No: ${response.data.orderNo}`);
        console.log(`  Status: ${response.data.status}`);
        if (response.data.referenceCode) {
          console.log(`  Reference Code: ${response.data.referenceCode}`);
        }
      }
    } else {
      console.log(`❌ FAILED: ${response.message}`);
      console.log(`  Error Code: ${response.code}`);
    }

    // Test 2: Query payment status
    if (response.code === '00000' && response.data) {
      console.log('\n🧪 Test 2: Querying Payment Status...\n');
      const statusResponse = await opayService.queryPaymentStatus(testReference);
      console.log('Status Response:', JSON.stringify(statusResponse, null, 2));
      
      if (statusResponse.code === '00000') {
        console.log('\n✅ SUCCESS: Payment status queried successfully!');
      } else {
        console.log(`\n❌ FAILED: ${statusResponse.message}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error instanceof Error) {
      console.error('  Message:', error.message);
      console.error('  Stack:', error.stack);
    }
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
};

testOPayConnection();

