import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wishlistService } from '../services/wishlist.service';
import toast from 'react-hot-toast';

export const useWishlist = () => {
  const queryClient = useQueryClient();

  const {
    data: wishlist,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await wishlistService.getWishlist();
      return response.data;
    },
  });

  const addToWishlistMutation = useMutation({
    mutationFn: (productId: string) => wishlistService.addToWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Added to wishlist!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add to wishlist');
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: (productId: string) => wishlistService.removeFromWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Removed from wishlist');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove from wishlist');
    },
  });

  return {
    wishlist,
    products: wishlist?.products || [],
    isLoading,
    error,
    isInWishlist: (productId: string) =>
      wishlist?.products.some((p) => p._id === productId) || false,
    addToWishlist: addToWishlistMutation,
    removeFromWishlist: removeFromWishlistMutation,
  };
};
