// src/hooks/useToast.js
import { useContext } from 'react';
import { ToastContext } from '../components/ToastProvider';

export const useToast = () => useContext(ToastContext);