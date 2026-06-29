import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUser, setTokens, logout as logoutAction } from '../store/slices/authSlice';
import { authService } from '../services/auth.service';
import { LoginData, RegisterData } from '../types';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await authService.getMe();
      return response.data;
    },
    retry: false,
    enabled: !!localStorage.getItem('persist:auth'),
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginData) => authService.login(data),
    onSuccess: (response) => {
      dispatch(setUser(response.data.user));
      dispatch(setTokens(response.data.tokens));
      toast.success('Login successful!');
      navigate('/');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (response) => {
      dispatch(setUser(response.data.user));
      dispatch(setTokens(response.data.tokens));
      toast.success('Registration successful!');
      navigate('/');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Registration failed');
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: (token: string) => authService.googleLogin(token),
    onSuccess: (response) => {
      dispatch(setUser(response.data.user));
      dispatch(setTokens(response.data.tokens));
      toast.success('Login successful!');
      navigate('/');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Google login failed');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      dispatch(logoutAction());
      queryClient.clear();
      toast.success('Logged out successfully');
      navigate('/login');
    },
  });

  const sendOtpMutation = useMutation({
    mutationFn: authService.sendOtp,
    onSuccess: () => {
      toast.success('OTP sent successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send OTP');
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: authService.verifyOtp,
    onSuccess: (response) => {
      dispatch(setUser(response.data.user));
      dispatch(setTokens(response.data.tokens));
      toast.success('Verification successful!');
      navigate('/');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Verification failed');
    },
  });

  return {
    user,
    isLoadingUser,
    userError,
    isAuthenticated: !!user,
    login: loginMutation,
    register: registerMutation,
    googleLogin: googleLoginMutation,
    logout: logoutMutation,
    sendOtp: sendOtpMutation,
    verifyOtp: verifyOtpMutation,
  };
};
