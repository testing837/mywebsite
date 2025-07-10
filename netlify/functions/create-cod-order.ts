import { Handler } from '@netlify/functions';
import { promises as fs } from 'fs';
import path from 'path';

interface OrderRequest {
  customerName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
  totalAmount: number;
}

interface NimbusPostOrder {
  client_id: string;
  warehouse_id: string;
  order_number: string;
  order_date: string;
  pickup_location: string;
  channel_id: string;
  comment: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name: string;
  shipping_last_name: string;
  shipping_address: string;
  shipping_address_2: string;
  shipping_city: string;
  shipping_pincode: string;
  shipping_state: string;
  shipping_country: string;
  shipping_email: string;
  shipping_phone: string;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount: string;
    tax: string;
    hsn: string;
  }>;
  payment_method: string;
  shipping_charges: number;
  giftwrap_charges: number;
  transaction_charges: number;
  total_discount: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
  cod_amount: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler: Handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const orderData: OrderRequest = JSON.parse(event.body || '{}');
    
    // Validate required fields
    const requiredFields = ['customerName', 'phone', 'address', 'city', 'state', 'pincode', 'items', 'totalAmount'];
    for (const field of requiredFields) {
      if (!orderData[field]) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: `Missing required field: ${field}` }),
        };
      }
    }

    // Validate phone number (Indian format)
    if (!/^[6-9]\d{9}$/.test(orderData.phone)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid phone number format' }),
      };
    }

    // Validate pincode (Indian format)
    if (!/^[1-9][0-9]{5}$/.test(orderData.pincode)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid pincode format' }),
      };
    }

    // Generate unique order number
    const orderNumber = `OYI${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Prepare NimbusPost order data
    const nimbusOrder: NimbusPostOrder = {
      client_id: process.env.NIMBUS_CLIENT_ID || '',
      warehouse_id: process.env.NIMBUS_WAREHOUSE_ID || '',
      order_number: orderNumber,
      order_date: new Date().toISOString().split('T')[0],
      pickup_location: "Primary",
      channel_id: "OYIEE_WEB",
      comment: "OYIEE Fashion Order - COD",
      billing_customer_name: orderData.customerName.split(' ')[0] || orderData.customerName,
      billing_last_name: orderData.customerName.split(' ').slice(1).join(' ') || '',
      billing_address: orderData.address,
      billing_address_2: '',
      billing_city: orderData.city,
      billing_pincode: orderData.pincode,
      billing_state: orderData.state,
      billing_country: 'India',
      billing_email: 'customer@oyiee.com',
      billing_phone: orderData.phone,
      shipping_is_billing: true,
      shipping_customer_name: orderData.customerName.split(' ')[0] || orderData.customerName,
      shipping_last_name: orderData.customerName.split(' ').slice(1).join(' ') || '',
      shipping_address: orderData.address,
      shipping_address_2: '',
      shipping_city: orderData.city,
      shipping_pincode: orderData.pincode,
      shipping_state: orderData.state,
      shipping_country: 'India',
      shipping_email: 'customer@oyiee.com',
      shipping_phone: orderData.phone,
      order_items: orderData.items.map((item, index) => ({
        name: item.name,
        sku: item.sku || `OYIEE-${index + 1}`,
        units: item.quantity,
        selling_price: item.price,
        discount: "0",
        tax: "18",
        hsn: "61091000"
      })),
      payment_method: "COD",
      shipping_charges: 50,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: orderData.totalAmount,
      length: 25,
      breadth: 20,
      height: 5,
      weight: 0.5,
      cod_amount: orderData.totalAmount
    };

    // Call NimbusPost API
    const nimbusResponse = await fetch('https://api.nimbuspost.com/v1/shipments/generate/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': process.env.NIMBUS_API_KEY || '',
      },
      body: JSON.stringify(nimbusOrder),
    });

    let nimbusResult;
    try {
      nimbusResult = await nimbusResponse.json();
    } catch (error) {
      console.error('Failed to parse NimbusPost response:', error);
      nimbusResult = { error: 'Invalid response from shipping provider' };
    }

    // Create order record
    const orderRecord = {
      orderId: orderNumber,
      customerName: orderData.customerName,
      phone: orderData.phone,
      address: orderData.address,
      city: orderData.city,
      state: orderData.state,
      pincode: orderData.pincode,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      status: 'Created',
      paymentMethod: 'COD',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      nimbusResponse: nimbusResult,
      trackingId: nimbusResult.data?.awb_number || null,
      trackingUpdates: [],
      canReview: false,
      hasReview: false,
      reviewId: null
    };

    // Save to orders.json
    try {
      const ordersPath = path.join(process.cwd(), 'data', 'orders.json');
      let orders = {};
      
      try {
        const ordersData = await fs.readFile(ordersPath, 'utf8');
        orders = JSON.parse(ordersData);
      } catch (error) {
        // File doesn't exist or is empty, start with empty object
        orders = {};
      }

      orders[orderNumber] = orderRecord;
      await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2));
      console.log('Order saved to orders.json:', orderNumber);
    } catch (error) {
      console.error('Failed to save order to orders.json:', error);
      // Continue execution even if file save fails
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        order_id: orderNumber,
        tracking_id: nimbusResult.data?.awb_number || null,
        status: 'Created',
        message: 'Order created successfully',
        nimbus_response: nimbusResult
      }),
    };

  } catch (error) {
    console.error('Order creation error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to create order',
        details: error.message 
      }),
    };
  }
};