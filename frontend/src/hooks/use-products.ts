import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { ProductFilters } from '../types';

export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const response = await productService.getProducts(filters);
      return response.data;
    },
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await productService.getProduct(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useProductBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['product', 'slug', slug],
    queryFn: async () => {
      const response = await productService.getProductBySlug(slug);
      return response.data;
    },
    enabled: !!slug,
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const response = await productService.getFeaturedProducts();
      return response.data;
    },
  });
};

export const useTrendingProducts = () => {
  return useQuery({
    queryKey: ['products', 'trending'],
    queryFn: async () => {
      const response = await productService.getTrendingProducts();
      return response.data;
    },
  });
};

export const useBestSellers = () => {
  return useQuery({
    queryKey: ['products', 'best-sellers'],
    queryFn: async () => {
      const response = await productService.getBestSellers();
      return response.data;
    },
  });
};

export const useRelatedProducts = (productId: string) => {
  return useQuery({
    queryKey: ['products', 'related', productId],
    queryFn: async () => {
      const response = await productService.getRelatedProducts(productId);
      return response.data;
    },
    enabled: !!productId,
  });
};

export const useSearchProducts = (query: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['products', 'search', query, page, limit],
    queryFn: async () => {
      const response = await productService.searchProducts(query, page, limit);
      return response.data;
    },
    enabled: !!query && query.length >= 2,
  });
};
