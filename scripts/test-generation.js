/**
 * Test script for verifying ad image generation under both Full Design and Classic modes.
 *
 * Usage: node scripts/test-generation.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api/generate-image';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const TEST_EMAIL = 'julianzuluagaduque@gmail.com';
const TOKEN = 'mock-test-token';

async function run() {
  console.log('\n======================================================');
  console.log('         AD IMAGE GENERATION TESTING SUITE            ');
  console.log('======================================================');

  // 1. Provision with Pro Plan credits
  console.log(`\n[1/4] Ensuring target user ${TEST_EMAIL} has active Pro Plan credits...`);
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  const { error: creditError } = await supabase.rpc('reset_credits_for_plan', {
    p_user_email:   TEST_EMAIL,
    p_plan:         'pro',
    p_ai_credits:   700,
    p_image_limit:  60,
    p_period_start: now.toISOString(),
    p_period_end:   periodEnd.toISOString(),
  });

  if (creditError) {
    console.error('❌ Provisioning credits failed:', creditError.message);
    process.exit(1);
  }
  console.log('✅ Credits provisioned successfully!');

  // 2. Test 1: Full Design Mode
  console.log('\n[2/4] Requesting TEST 1: Diseño IA Completo (Estilo ClickAds) [fullDesign: true]...');
  const payloadFull = {
    productName: 'Reloj Deportivo Pro',
    description: 'Un reloj inteligente de alta gama resistente al agua para deportistas con sensor de ritmo cardíaco.',
    format: 'square',
    primaryColor: '#c084fc',
    angle: 'desire',
    fullDesign: true,
    variationsCount: 1
  };

  try {
    const responseFull = await axios.post(API_URL, payloadFull, {
      headers: {
        Authorization: `Bearer ${TOKEN}`
      }
    });

    console.log('✅ Test 1 API Response Status:', responseFull.status);
    if (responseFull.data.images && responseFull.data.images.length > 0) {
      const imgData = responseFull.data.images[0];
      console.log(`✅ Generated creative successfully! Angle: ${imgData.angle}, Label: ${imgData.label}`);
      
      // Save full design image to disk
      const base64Data = imgData.imageUrl.split(',')[1];
      const outputPath = path.join(__dirname, 'test-output-fulldesign.jpg');
      fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
      console.log(`💾 Saved Full Design creative to: ${outputPath}`);
    } else {
      console.error('❌ Test 1 returned no images. Errors:', responseFull.data.errors);
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error.response?.data || error.message);
  }

  // 3. Test 2: Classic Mode
  console.log('\n[3/4] Requesting TEST 2: Modo Clásico (Plantillas Canva) [fullDesign: false]...');
  const payloadClassic = {
    productName: 'Reloj Deportivo Pro',
    description: 'Un reloj inteligente de alta gama resistente al agua para deportistas con sensor de ritmo cardíaco.',
    format: 'square',
    primaryColor: '#c084fc',
    angle: 'desire',
    fullDesign: false,
    variationsCount: 1
  };

  try {
    const responseClassic = await axios.post(API_URL, payloadClassic, {
      headers: {
        Authorization: `Bearer ${TOKEN}`
      }
    });

    console.log('✅ Test 2 API Response Status:', responseClassic.status);
    if (responseClassic.data.images && responseClassic.data.images.length > 0) {
      const imgData = responseClassic.data.images[0];
      console.log(`✅ Generated creative successfully! Angle: ${imgData.angle}, Label: ${imgData.label}`);
      
      // Save classic image to disk
      const base64Data = imgData.imageUrl.split(',')[1];
      const outputPath = path.join(__dirname, 'test-output-classic.jpg');
      fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
      console.log(`💾 Saved Classic creative to: ${outputPath}`);
    } else {
      console.error('❌ Test 2 returned no images. Errors:', responseClassic.data.errors);
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error.response?.data || error.message);
  }

  console.log('\n======================================================');
  console.log('             TESTING SUITE COMPLETE                   ');
  console.log('======================================================\n');
}

run().catch(console.error);
