import { Handler } from '@netlify/functions';
import { promises as fs } from 'fs';
import path from 'path';

interface ReviewRequest {
  orderId: string;
  rating: number;
  comment: string;
  imageUrl?: string;
  customerName?: string;
  productName?: string;
}

interface Review {
  id: string;
  orderId: string;
  rating: number;
  comment: string;
  imageUrl?: string;
  customerName?: string;
  productName?: string;
  createdAt: string;
  verified: boolean;
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
    const reviewData: ReviewRequest = JSON.parse(event.body || '{}');
    
    // Validate required fields
    if (!reviewData.orderId || !reviewData.rating || !reviewData.comment) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required fields: orderId, rating, comment' }),
      };
    }

    // Validate rating range
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Rating must be between 1 and 5' }),
      };
    }

    // Check if order exists and is delivered from orders.json
    let order = null;
    
    try {
      const ordersPath = path.join(process.cwd(), 'data', 'orders.json');
      const ordersData = await fs.readFile(ordersPath, 'utf8');
      const orders = JSON.parse(ordersData);
      order = orders[reviewData.orderId];
    } catch (error) {
      console.error('Failed to read order from orders.json:', error);
    }

    if (!order) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Order not found' }),
      };
    }

    // Check if order is delivered (can review)
    if (!order.canReview && order.status?.toLowerCase() !== 'delivered') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Can only review delivered orders' }),
      };
    }

    // Check if review already exists for this order
    try {
      const reviewsPath = path.join(process.cwd(), 'data', 'reviews.json');
      let reviews = [];
      
      try {
        const reviewsData = await fs.readFile(reviewsPath, 'utf8');
        reviews = JSON.parse(reviewsData);
      } catch (error) {
        // File doesn't exist, start with empty array
        reviews = [];
      }
      
      const existingReview = reviews.find(r => r.orderId === reviewData.orderId);
      if (existingReview) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Review already exists for this order' }),
        };
      }
    } catch (error) {
      console.error('Failed to check existing review:', error);
    }

    // Generate unique review ID
    const reviewId = `REV${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create review object
    const review: Review = {
      id: reviewId,
      orderId: reviewData.orderId,
      rating: reviewData.rating,
      comment: reviewData.comment.trim(),
      imageUrl: reviewData.imageUrl || undefined,
      customerName: reviewData.customerName || order.customerName || 'Anonymous',
      productName: reviewData.productName || (order.items && order.items[0]?.name) || 'Product',
      createdAt: new Date().toISOString(),
      verified: true // Since it's linked to a real order
    };

    // Save review to reviews.json
    try {
      const reviewsPath = path.join(process.cwd(), 'data', 'reviews.json');
      let reviews = [];
      
      try {
        const reviewsData = await fs.readFile(reviewsPath, 'utf8');
        reviews = JSON.parse(reviewsData);
      } catch (error) {
        // File doesn't exist, start with empty array
        reviews = [];
      }
      
      reviews.push(review);
      await fs.writeFile(reviewsPath, JSON.stringify(reviews, null, 2));
      console.log('Review saved to reviews.json:', reviewId);
    } catch (error) {
      console.error('Failed to save review to reviews.json:', error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Failed to save review' }),
      };
    }

    // Update order to mark as reviewed
    try {
      const ordersPath = path.join(process.cwd(), 'data', 'orders.json');
      const ordersData = await fs.readFile(ordersPath, 'utf8');
      const orders = JSON.parse(ordersData);
      
      if (orders[reviewData.orderId]) {
        orders[reviewData.orderId].hasReview = true;
        orders[reviewData.orderId].reviewId = reviewId;
        await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2));
        console.log('Order updated with review info:', reviewData.orderId);
      }
    } catch (error) {
      console.error('Failed to update order with review info:', error);
      // Continue even if order update fails
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        review_id: reviewId,
        message: 'Review submitted successfully',
        review: review
      }),
    };

  } catch (error) {
    console.error('Review submission error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to submit review',
        details: error.message 
      }),
    };
  }
};