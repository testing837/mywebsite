import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Star, Upload, Loader2, X } from 'lucide-react';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating is required').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(10, 'Review must be at least 10 characters'),
  customerName: z.string().optional(),
  productName: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  orderId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ orderId, onSuccess, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema)
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 4MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      // Convert file to base64 for mock upload
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          // Mock UploadThing API call
          const response = await fetch('/.netlify/functions/upload-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileData: reader.result,
              fileName: file.name,
              fileType: file.type,
            }),
          });

          const result = await response.json();
          
          if (result.success) {
            setUploadedImage(result.fileUrl);
            toast({
              title: 'Image uploaded successfully',
              description: 'Your image has been uploaded',
            });
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } catch (error) {
          console.error('Upload error:', error);
          toast({
            title: 'Upload failed',
            description: 'Failed to upload image. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploading(false);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
  };

  const onSubmit = async (data: ReviewFormData) => {
    if (rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a rating',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/.netlify/functions/submit-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          rating,
          comment: data.comment,
          imageUrl: uploadedImage,
          customerName: data.customerName,
          productName: data.productName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Review submitted successfully!',
          description: 'Thank you for your feedback.',
        });
        onSuccess();
      } else {
        throw new Error(result.error || 'Failed to submit review');
      }
    } catch (error: any) {
      console.error('Review submission error:', error);
      toast({
        title: 'Failed to submit review',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
    >
      <Card className="bg-cyber-dark-gray/95 border-cyber-gold/30 text-cyber-gold max-w-md w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="font-orbitron cyber-text-glow flex items-center justify-between">
            Write Review
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-cyber-gold hover:bg-cyber-gold/10"
            >
              <X size={20} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Rating */}
            <div>
              <Label className="text-cyber-gold font-tech">Rating *</Label>
              <div className="flex items-center space-x-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(star);
                      setValue('rating', star);
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-2xl transition-colors"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? 'text-cyber-gold fill-current'
                          : 'text-cyber-gold/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {errors.rating && (
                <p className="text-red-400 text-sm mt-1">{errors.rating.message}</p>
              )}
            </div>

            {/* Comment */}
            <div>
              <Label htmlFor="comment" className="text-cyber-gold font-tech">
                Review *
              </Label>
              <Textarea
                id="comment"
                {...register('comment')}
                className="bg-black/50 border-cyber-gold/30 text-cyber-gold"
                placeholder="Share your experience with this product..."
                rows={4}
              />
              {errors.comment && (
                <p className="text-red-400 text-sm mt-1">{errors.comment.message}</p>
              )}
            </div>

            {/* Customer Name */}
            <div>
              <Label htmlFor="customerName" className="text-cyber-gold font-tech">
                Your Name (Optional)
              </Label>
              <Input
                id="customerName"
                {...register('customerName')}
                className="bg-black/50 border-cyber-gold/30 text-cyber-gold"
                placeholder="Enter your name"
              />
            </div>

            {/* Product Name */}
            <div>
              <Label htmlFor="productName" className="text-cyber-gold font-tech">
                Product Name (Optional)
              </Label>
              <Input
                id="productName"
                {...register('productName')}
                className="bg-black/50 border-cyber-gold/30 text-cyber-gold"
                placeholder="Enter product name"
              />
            </div>

            {/* Image Upload */}
            <div>
              <Label className="text-cyber-gold font-tech">
                Upload Image (Optional)
              </Label>
              <div className="mt-2">
                {uploadedImage ? (
                  <div className="relative">
                    <img
                      src={uploadedImage}
                      alt="Review"
                      className="w-full h-32 object-cover rounded border border-cyber-gold/30"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-black/50 text-cyber-gold hover:bg-black/70"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-cyber-gold/30 rounded p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 text-cyber-gold animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 text-cyber-gold/60" />
                      )}
                      <span className="text-cyber-gold/60 font-tech text-sm">
                        {isUploading ? 'Uploading...' : 'Click to upload image'}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 border-cyber-gold/30 text-cyber-gold hover:bg-cyber-gold/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || rating === 0}
                className="flex-1 bg-cyber-gold text-black hover:bg-cyber-gold/80 font-tech"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReviewForm;