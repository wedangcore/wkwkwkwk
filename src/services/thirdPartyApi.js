// src/services/thirdPartyApi.js
import axios from 'axios';

export const checkEwallet = async (phoneNumber, ewalletType) => {
  const url = `https://checker.orderkuota.com/api/checkname/produk/260cc3cac9/01/388034/${ewalletType}`;
  const response = await axios.post(url, {
    phoneNumber,
  });
  return response.data;
};

export const listBanks = async () => {
  const response = await axios.post('https://atlantich2h.com/transfer/bank_list', {
    api_key: process.env.ATLANTIC_API_KEY,
  });
  return response.data;
};

export const checkBankAccount = async (bankCode, accountNumber) => {
  const response = await axios.post('https://atlantich2h.com/transfer/cek_rekening', {
    api_key: process.env.ATLANTIC_API_KEY,
    bank_code: bankCode,
    account_number: accountNumber,
  });
  return response.data;
};
