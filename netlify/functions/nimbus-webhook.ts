import { Handler } from '@netlify/functions';
import { promises as fs } from 'fs';
import path from 'path';

interface WebhookPayload {
  awb_number: string;
  order_number: string;
  event: string;
  current_status: string;
  previous_status: string;
  updated_at: string;
  delivery_date?: string;
  remarks?: string;
  location?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    const webhookData: WebhookPayload = JSON.parse(event.body || '{}');
    
    console.log('Received webhook:', webhookData);

    if (!webhookData.order_number || !webhookData.event) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required webhook data' }),
      };
    }

    // Load existing orders from orders.json
    const ordersPath = path.join(process.cwd(), 'data', 'orders.json');
    let orders = {};
    
    try {
      const ordersData = await fs.readFile(ordersPath, 'utf8');
      orders = JSON.parse(ordersData);
    } catch (error) {
      console.error('Failed to read orders.json:', error);
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Orders file not found' }),
      };
    }

    const orderNumber = webhookData.order_number;
    const order = orders[orderNumber];

    if (!order) {
      console.log(`Order ${orderNumber} not found in orders.json`);
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Order not found' }),
      };
    }

    // Update order status
    order.status = webhookData.current_status;
    order.lastUpdated = new Date().toISOString();
    order.trackingUpdates = order.trackingUpdates || [];
    
    // Add tracking update
    order.trackingUpdates.push({
      event: webhookData.event,
      status: webhookData.current_status,
      previousStatus: webhookData.previous_status,
      updatedAt: webhookData.updated_at,
      deliveryDate: webhookData.delivery_date,
      remarks: webhookData.remarks,
      location: webhookData.location,
    });

    // Special handling for delivered status
    if (webhookData.event === 'Delivered' || webhookData.current_status.toLowerCase() === 'delivered') {
      order.deliveredAt = webhookData.delivery_date || new Date().toISOString();
      order.canReview = true;
      console.log(`Order ${orderNumber} marked as delivered and can now be reviewed`);
    }

    // Save updated orders back to file
    try {
      await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2));
      console.log(`Order ${orderNumber} updated successfully in orders.json`);
    } catch (error) {
      console.error('Failed to save updated orders to orders.json:', error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Failed to update order in storage' }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Order status updated successfully',
        order_number: orderNumber,
        new_status: webhookData.current_status
      }),
    };

  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to process webhook',
        details: error.message 
      }),
    };
  }
};