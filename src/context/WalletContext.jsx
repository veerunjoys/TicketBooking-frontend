import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../api';
import { AuthContext } from './AuthContext';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const { user } = useContext(AuthContext);

  const refreshBalance = async () => {
    if (!user || user.role === 'admin') {
      setBalance(0);
      return;
    }

    try {
      const response = await API.get('/wallet/balance');
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    }
  };

  useEffect(() => {
    refreshBalance();
  }, [user]);

  const topup = async (amount, idempotencyKey) => {
    try {
      const response = await API.post(
        '/wallet/topup',
        { amount },
        { headers: { 'Idempotency-Key': idempotencyKey } }
      );
      await refreshBalance();
      return { success: true, newBalance: response.data.newBalance };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Top-up failed.',
      };
    }
  };

  return (
    <WalletContext.Provider value={{ balance, refreshBalance, topup }}>
      {children}
    </WalletContext.Provider>
  );
};
