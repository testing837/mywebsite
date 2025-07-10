
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, DollarSign, MapPin, User, Star, MessageSquare } from 'lucide-react';
import Navigation from '@/components/Navigation';
import ReviewForm from '@/components/ReviewForm';
import { useToast } from '@/hooks/use-toast';
import ReviewForm from '@/components/ReviewForm';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface CustomerInfo {
  name: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  items: OrderItem[];
  customerInfo?: CustomerInfo;
  canReview?: boolean;
  hasReview?: boolean;
  reviewId?: string;
  canReview?: boolean;
  hasReview?: boolean;
  reviewId?: string;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const { toast } = useToast();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
      // In a real app, you would fetch from your API
      // For now, we'll use localStorage as fallback
      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast({
        title: 'Failed to load orders',
        description: 'Please try refreshing the page',
        variant: 'destructive',
      });
    }
  };

  const handleWriteReview = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowReviewForm(true);
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    setSelectedOrderId('');
    loadOrders(); // Reload orders to update review status
    toast({
      title: 'Review submitted!',
      description: 'Thank you for your feedback.',
    });
  };

  const handleReviewCancel = () => {
    setShowReviewForm(false);
    setSelectedOrderId('');
  };

  const loadOrders = async () => {
    try {
      // In a real app, you would fetch from your API
      // For now, we'll use localStorage as fallback
      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast({
        title: 'Failed to load orders',
        description: 'Please try refreshing the page',
        variant: 'destructive',
      });
    }
  };

  const handleWriteReview = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowReviewForm(true);
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    setSelectedOrderId('');
    loadOrders(); // Reload orders to update review status
    toast({
      title: 'Review submitted!',
      description: 'Thank you for your feedback.',
    });
  };

  const handleReviewCancel = () => {
    setShowReviewForm(false);
    setSelectedOrderId('');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'shipped':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-cyber-gold/20 text-cyber-gold border-cyber-gold/30';
    }
  };

  return (
    <div className="min-h-screen bg-black text-cyber-gold">
      <Navigation />
      <div className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-orbitron font-bold mb-8 cyber-text-glow"
          >
            YOUR ORDERS
          </motion.h1>

          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <Package className="mx-auto h-24 w-24 text-cyber-gold/50 mb-6" />
              <h2 className="text-2xl font-orbitron font-bold mb-4">
                NO ORDERS YET
              </h2>
              <p className="text-cyber-gold/80 font-tech">
                Your order history will appear here
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-cyber-dark-gray/50 border-cyber-gold/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-orbitron text-cyber-gold">
                          Order {order.id}
                        </CardTitle>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-cyber-gold/80">
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} />
                          <span>{new Date(order.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign size={16} />
                          <span>${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Order Items */}
                      <div className="space-y-2">
                        <h4 className="font-orbitron font-bold text-cyber-gold flex items-center gap-2">
                          <Package size={16} />
                          Items Ordered
                        </h4>
                        {order.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex justify-between items-center pl-6">
                            <span className="text-cyber-gold font-tech">
                              {item.name} x{item.quantity}
                            </span>
                            <span className="text-cyber-gold font-bold">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Customer Information */}
                      {order.customerInfo && (
                        <div className="border-t border-cyber-gold/30 pt-4 space-y-2">
                          <h4 className="font-orbitron font-bold text-cyber-gold flex items-center gap-2">
                            <User size={16} />
                            Customer Details
                          </h4>
                          <div className="pl-6 space-y-1 text-sm">
                            <p className="text-cyber-gold/80">
                              <span className="font-bold">Name:</span> {order.customerInfo.name}
                            </p>
                            <p className="text-cyber-gold/80">
                              <span className="font-bold">Email:</span> {order.customerInfo.email}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Shipping Address */}
                      {order.customerInfo?.address && (
                        <div className="border-t border-cyber-gold/30 pt-4 space-y-2">
                          <h4 className="font-orbitron font-bold text-cyber-gold flex items-center gap-2">
                            <MapPin size={16} />
                            Shipping Address
                          </h4>
                          <div className="pl-6 text-sm text-cyber-gold/80">
                            <p>{order.customerInfo.address.street}</p>
                            <p>
                              {order.customerInfo.address.city}, {order.customerInfo.address.state} {order.customerInfo.address.zipCode}
                            </p>
                            <p>{order.customerInfo.address.country}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Review Actions */}
        {orders.map((order, index) => (
          <motion.div
            key={`review-${order.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-cyber-dark-gray/50 border-cyber-gold/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-orbitron font-bold text-cyber-gold mb-2">
                      Order {order.id}
                    </h3>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    
                    {/* Review Actions */}
                    <div className="mt-4 pt-4 border-t border-cyber-gold/30">
                      {order.canReview && !order.hasReview && (
                        <Button
                          onClick={() => handleWriteReview(order.id)}
                          className="bg-cyber-gold text-black hover:bg-cyber-gold/80 font-tech"
                        >
                          <Star className="mr-2 h-4 w-4" />
                          Write Review
                        </Button>
                      )}
                      
                      {order.hasReview && (
                        <div className="flex items-center text-cyber-gold/60 font-tech text-sm">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Review Submitted
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {order.canReview && !order.hasReview && (
                    <Button
                      onClick={() => handleWriteReview(order.id)}
                      className="bg-cyber-gold text-black hover:bg-cyber-gold/80 font-tech"
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Write Review
                    </Button>
                  )}
                  
                  {order.hasReview && (
                    <div className="flex items-center text-cyber-gold/60 font-tech text-sm">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Review Submitted
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewForm
          orderId={selectedOrderId}
          onSuccess={handleReviewSuccess}
          onCancel={handleReviewCancel}
        />
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewForm
          orderId={selectedOrderId}
          onSuccess={handleReviewSuccess}
          onCancel={handleReviewCancel}
        />
      )}
    </div>
  );
};

export default Orders;
