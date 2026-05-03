import { pullMasterData, pushOperationalData, setAuthToken } from './sync-agent.js';
import axios from 'axios';

async function testPhase4() {
  console.log('🧪 Testing Phase 4: Synchronization Engine');

  // 1. Get Token from Central
  console.log('Logging into Central...');
  const loginRes = await axios.post('http://localhost:3001/auth/login', {
    email: 'admin@kasir.com',
    password: 'admin123'
  });
  const token = loginRes.data.token;
  await setAuthToken(token);

  // 2. Test PULL
  console.log('Testing PULL mechanism...');
  await pullMasterData();

  // 3. Test PUSH
  console.log('Testing PUSH mechanism...');
  // Ensure we have some unsynced data in local SQLite
  // (Assuming Phase 3 test already left some data, but let's make sure)
  await pushOperationalData();

  console.log('✅ Phase 4 Test Complete');
  process.exit(0);
}

testPhase4().catch(console.error);
