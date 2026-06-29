import api from "./api";

export interface ServiceableCity {
  city: string;
  state: string;
  country: string;
}

export const deliveryZoneService = {
  /** Public: Check if a pincode is serviceable */
  check: async (pincode: string) => {
    const response = await api.get(`/delivery-zones/check/${pincode}`);
    return response.data;
  },

  /** Public: List all unique serviceable cities, optionally filtered by ?search= */
  cities: async (search?: string) => {
    const response = await api.get("/delivery-zones/cities", {
      params: search ? { search } : undefined,
    });
    return response.data;
  },
};
