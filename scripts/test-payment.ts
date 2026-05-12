import { config } from '../src/config/env';
import { MonnifyService } from '../src/services/monnify.service';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function testMonnifyConnection() {
  if (
    !config.monnify.apiKey ||
    !config.monnify.secretKey ||
    !config.monnify.contractCode
  ) {
    console.error('Error: Monnify credentials not found in environment variables');
    console.log('\nAdd to .env:');
    console.log('  MONNIFY_API_KEY=your-api-key');
    console.log('  MONNIFY_SECRET_KEY=your-secret-key');
    console.log('  MONNIFY_CONTRACT_CODE=your-contract-code');
    console.log('  MONNIFY_BASE_URL=https://sandbox.monnify.com  # or production');
    console.log('  MONNIFY_RETURN_URL=http://localhost:3000/payments/return');
    console.log('  MONNIFY_CALLBACK_URL=http://localhost:3000/payments/callback\n');
    process.exit(1);
  }

  console.log('Monnify Configuration:');
  console.log(`  API Key (prefix): ${config.monnify.apiKey.substring(0, 12)}…`);
  console.log(`  Base URL: ${config.monnify.baseUrl}`);
  console.log(`  Contract: ${config.monnify.contractCode.substring(0, 8)}…`);
  console.log(`  Callback URL: ${config.monnify.callbackUrl}`);
  console.log(`  Return URL: ${config.monnify.returnUrl}\n`);

  const monnify = new MonnifyService();

  console.log('Test 1: Login (JWT)...\n');
  await monnify.getBearerToken();
  console.log('Login OK.\n');

  console.log('Test 2: Init checkout transaction (sandbox)...\n');

  const paymentReference = `BOOKMATE-SMOKE-${Date.now()}`;
  const init = await monnify.initTransaction({
    amount: 20,
    customerEmail: 'bookmate@test.local',
    customerName: 'Bookmate Smoke',
    paymentReference,
    paymentDescription: 'Bookmate gateway smoke test',
    paymentMethods: ['CARD', 'ACCOUNT_TRANSFER', 'USSD', 'PHONE_NUMBER'],
    metadata: { source: 'test-payment-script' },
  });

  console.log(`  Merchant ref: ${init.paymentReference}`);
  console.log(`  Monnify txn: ${init.transactionReference}`);
  console.log(`  Checkout URL: ${init.checkoutUrl || '(none)'}`);

  if (init.checkoutUrl) {
    console.log('\nWaiting 5s before re-query status (typically still pending)...\n');
    await sleep(5000);
    try {
      const status = await monnify.getTransactionStatus(paymentReference);
      console.log('Query by payment reference OK:');
      console.log(`  paymentStatus=${status.paymentStatus} amountPaid=${status.amountPaid}`);
    } catch (e) {
      console.log(`Status query failed (expected if unpaid): ${(e as Error).message}`);
    }
  }

  console.log('\nDone.');
}

testMonnifyConnection().catch((err) => {
  console.error(err);
  process.exit(1);
});
