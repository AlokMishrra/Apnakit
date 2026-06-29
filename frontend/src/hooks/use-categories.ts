import { useQuery } from '@tanstack/react-query';
import { categoryService } from '../services/category.service';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoryService.getCategories();
      return response.data;
    },
  });
};

export const useCategory = (slug: string) => {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const response = await categoryService.getCategoryBySlug(slug);
      return response.data;
    },
    enabled: !!slug,
  });
};
